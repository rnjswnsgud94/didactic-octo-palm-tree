import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import { buildPlanningDurations } from "@/lib/data/planning-durations";
import {
  filterFastTrackTargetProcedureIds,
  filterPlanDeemedProcedureIds,
} from "@/lib/data/special-law-processes";
import {
  evaluateSelectedSpecialLaws,
  specialLawImpactsForProcedure,
} from "@/lib/data/special-laws";
import { scenarioAnswersToProjectInput } from "@/lib/domain/project-input";
import { resolveAllProcedures } from "@/lib/engine/rule-engine";
import { calculateSchedule, type DurationScenario } from "@/lib/engine/schedule";

export type EvaluationOptions = {
  includeConditional: boolean;
  includePractical: boolean;
};

export function evaluateProject(
  answers: ScenarioAnswers,
  options: EvaluationOptions = {
    includeConditional: true,
    includePractical: true,
  },
) {
  const evaluatedAnswers: ScenarioAnswers = {
    ...answers,
    advancedStrategicIndustryFastTrackPermitIds:
      filterFastTrackTargetProcedureIds(
        "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
        answers.advancedStrategicIndustryFastTrackPermitIds,
        catalog.procedures,
      ),
    semiconductorClusterFastTrackPermitIds:
      filterFastTrackTargetProcedureIds(
        "SEMICONDUCTOR_CLUSTER_FAST_TRACK",
        answers.semiconductorClusterFastTrackPermitIds,
        catalog.procedures,
      ),
    semiconductorClusterPlanIncludedPermitIds:
      filterPlanDeemedProcedureIds(
        "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING",
        answers.semiconductorClusterPlanIncludedPermitIds,
      ),
    industrialComplexPlanIncludedPermitIds:
      filterPlanDeemedProcedureIds(
        "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL",
        answers.industrialComplexPlanIncludedPermitIds,
      ),
    regionalSpecialZonePlanIncludedPermitIds:
      filterPlanDeemedProcedureIds(
        "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING",
        answers.regionalSpecialZonePlanIncludedPermitIds,
      ),
  };
  const input = scenarioAnswersToProjectInput(
    evaluatedAnswers,
    catalog.procedures,
  );
  const baseDecisions = resolveAllProcedures(
    [...catalog.procedures],
    [...catalog.rules],
    input,
    catalog.coverage.catalogVersion,
  );
  const decisions = baseDecisions.map((decision) => ({
    ...decision,
    specialLawImpacts: specialLawImpactsForProcedure(
      evaluatedAnswers,
      decision.procedure,
    ),
  }));
  const specialLawEvaluations = evaluateSelectedSpecialLaws(evaluatedAnswers);
  const planningDurations = buildPlanningDurations(
    catalog.procedures,
    catalog.durations,
    evaluatedAnswers,
  );
  const schedules = Object.fromEntries(
    (["MIN", "TYPICAL"] as DurationScenario[]).map((scenario) => [
      scenario,
      calculateSchedule({
        decisions,
        edges: [...catalog.edges],
        durations: [...catalog.durations],
        scenario,
        includeConditional: options.includeConditional,
        includePractical: options.includePractical,
        constructionPlan: {
          assessmentDate: evaluatedAnswers.assessmentDate,
          plannedStartDate: evaluatedAnswers.plannedConstructionStartDate,
          plannedEndDate: evaluatedAnswers.plannedConstructionEndDate,
        },
        planningDurations,
      }),
    ]),
  ) as Record<DurationScenario, ReturnType<typeof calculateSchedule>>;
  const counts = decisions.reduce(
    (accumulator, decision) => {
      accumulator[decision.status] += 1;
      return accumulator;
    },
    {
      APPLIES: 0,
      DOES_NOT_APPLY: 0,
      POSSIBLY_APPLIES: 0,
      NEEDS_MORE_INFO: 0,
    },
  );
  return { input, decisions, schedules, counts, specialLawEvaluations };
}
