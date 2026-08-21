import { describe, expect, it } from "vitest";

import { procedureCategoryForDecision } from "@/app/components/dashboard/constants";
import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import { supplementalPermitTargetIds } from "@/lib/data/supplemental-permit-targets";
import { evaluateProject } from "@/lib/engine/pipeline";

function evaluate(overrides: Partial<ScenarioAnswers>) {
  return evaluateProject({
    ...catalog.scenarios[0].answers,
    assessmentDate: "2026-08-21",
    province: "충청남도",
    city: "아산시",
    insideIndustrialComplex: false,
    industryCategory: "GENERAL_MANUFACTURING",
    roadConnectionRequired: false,
    integratedEnvironmentalPermitTarget: false,
    chemicalsHandled: false,
    hazardousMaterials: false,
    psmCovered: false,
    ...overrides,
  });
}

function decision(
  evaluation: ReturnType<typeof evaluate>,
  procedureId: string,
) {
  const result = evaluation.decisions.find(
    (item) => item.procedure.id === procedureId,
  );
  if (!result) throw new Error(`Missing decision: ${procedureId}`);
  return result;
}

describe("supplemental permit threshold review", () => {
  it("keeps proxy-only procedures in confirmation until the threshold review is completed", () => {
    const evaluation = evaluate({
      supplementalPermitReviewedIds: [],
      supplementalPermitTargetIds: [],
    });

    for (const procedureId of supplementalPermitTargetIds) {
      const result = decision(evaluation, procedureId);
      expect(procedureCategoryForDecision(result), procedureId).toBe("CONFIRM");
      expect(result.missingInputs, procedureId).toContain(
        `confirmation.supplementalPermitTargets.${procedureId}`,
      );
    }
  });

  it("routes every reviewed item into either roadmap inclusion or confirmed exclusion", () => {
    const selected = [
      "road-occupation-permit",
      "fugitive-dust-business-report",
      "hazard-prevention-plan",
    ] as const;
    const evaluation = evaluate({
      supplementalPermitReviewedIds: [...supplementalPermitTargetIds],
      supplementalPermitTargetIds: [...selected],
    });

    for (const procedureId of supplementalPermitTargetIds) {
      const result = decision(evaluation, procedureId);
      expect(result.missingInputs, procedureId).toEqual([]);
      expect(procedureCategoryForDecision(result), procedureId).toBe(
        selected.includes(procedureId as (typeof selected)[number])
          ? "REQUIRED"
          : "NOT_REQUIRED",
      );
    }
  });

  it("resolves only the individually reviewed item and leaves every untouched item unconfirmed", () => {
    const evaluation = evaluate({
      supplementalPermitReviewedIds: ["road-occupation-permit"],
      supplementalPermitTargetIds: [],
    });

    expect(
      procedureCategoryForDecision(
        decision(evaluation, "road-occupation-permit"),
      ),
    ).toBe("NOT_REQUIRED");
    expect(
      procedureCategoryForDecision(
        decision(evaluation, "fugitive-dust-business-report"),
      ),
    ).toBe("CONFIRM");
  });

  it.each([
    {
      name: "PSM 비대상",
      psmCovered: false,
      sameScope: null,
      category: "REQUIRED",
      status: "APPLIES",
      deemed: false,
    },
    {
      name: "PSM 대상이나 별도 설비·범위",
      psmCovered: true,
      sameScope: false,
      category: "REQUIRED",
      status: "APPLIES",
      deemed: false,
    },
    {
      name: "PSM 대상이나 동일설비 범위 미확인",
      psmCovered: true,
      sameScope: null,
      category: "CONFIRM",
      status: "NEEDS_MORE_INFO",
      deemed: false,
    },
    {
      name: "PSM이 동일 유해·위험설비를 포함",
      psmCovered: true,
      sameScope: true,
      category: "REQUIRED",
      status: "DOES_NOT_APPLY",
      deemed: true,
    },
  ] as const)("applies the PSM deeming boundary: $name", ({
    psmCovered,
    sameScope,
    category,
    status,
    deemed,
  }) => {
    const evaluation = evaluate({
      supplementalPermitReviewedIds: ["hazard-prevention-plan"],
      supplementalPermitTargetIds: ["hazard-prevention-plan"],
      psmCovered,
      psmCoversSameHazardPreventionScope: sameScope,
    });
    const hazardPlan = decision(evaluation, "hazard-prevention-plan");

    expect(procedureCategoryForDecision(hazardPlan)).toBe(category);
    expect(hazardPlan.status).toBe(status);
    expect(hazardPlan.isDeemed).toBe(deemed);
    expect(hazardPlan.procedure.citationIds).toContain(
      "cit-osh-42-3-psm-deeming",
    );

    if (sameScope === null && psmCovered) {
      expect(hazardPlan.missingInputs).toContain(
        "safety.psmCoversSameHazardPreventionScope",
      );
    }
    if (deemed) {
      const psm = decision(evaluation, "process-safety-report");
      expect(psm.status).toBe("APPLIES");
      expect(psm.procedure.citationIds).toContain(
        "cit-osh-42-3-psm-deeming",
      );
      expect(hazardPlan.matchedRuleIds).toContain(
        "rule-exp-hazard-prevention-psm-exclusion",
      );
      expect(evaluation.schedules.TYPICAL.topologicalOrder).not.toContain(
        "hazard-prevention-plan",
      );
    }
  });
});
