import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
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
  const input = scenarioAnswersToProjectInput(answers);
  const decisions = resolveAllProcedures(
    [...catalog.procedures],
    [...catalog.rules],
    input,
    catalog.coverage.catalogVersion,
  );
  const schedules = Object.fromEntries(
    (["MIN", "BASE", "MAX"] as DurationScenario[]).map((scenario) => [
      scenario,
      calculateSchedule({
        decisions,
        edges: [...catalog.edges],
        durations: [...catalog.durations],
        scenario,
        includeConditional: options.includeConditional,
        includePractical: options.includePractical,
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
  return { input, decisions, schedules, counts };
}
