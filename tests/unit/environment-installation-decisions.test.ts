import { describe, expect, it } from "vitest";

import { procedureCategoryForDecision } from "@/app/components/dashboard/constants";
import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import { scenarioAnswersToProjectInput } from "@/lib/domain/project-input";
import { resolveAllProcedures } from "@/lib/engine/rule-engine";

function decide(overrides: Partial<ScenarioAnswers>) {
  const answers: ScenarioAnswers = {
    ...catalog.scenarios[0].answers,
    industryCategory: "GENERAL_MANUFACTURING",
    insideIndustrialComplex: false,
    integratedEnvironmentalPermitTarget: false,
    airEmissionFacility: false,
    waterDischargeFacility: false,
    noiseVibrationFacility: false,
    ...overrides,
  };
  return resolveAllProcedures(
    catalog.procedures,
    catalog.rules,
    scenarioAnswersToProjectInput(answers, catalog.procedures),
    catalog.coverage.catalogVersion,
  );
}

function decision(
  decisions: ReturnType<typeof decide>,
  procedureId: string,
) {
  const result = decisions.find((item) => item.procedure.id === procedureId);
  if (!result) throw new Error(`Missing procedure decision: ${procedureId}`);
  return result;
}

const installationFacilities = [
  ["airEmissionFacility", "air-emission-installation-permit"],
  ["waterDischargeFacility", "water-discharge-installation-permit"],
  ["noiseVibrationFacility", "noise-vibration-facility-report"],
] as const;

describe("structured environmental installation decisions", () => {
  it.each(installationFacilities)(
    "routes a confirmed %s=true answer into the roadmap",
    (answerKey, procedureId) => {
      const result = decision(decide({ [answerKey]: true }), procedureId);

      expect(result.missingInputs).toEqual([]);
      expect(result.conflictRuleIds).toEqual([]);
      expect(result.provisionalEffect).toBe("INCLUDE");
      expect(procedureCategoryForDecision(result)).toBe("REQUIRED");
    },
  );

  it.each(installationFacilities)(
    "routes a confirmed %s=false answer into confirmed exclusion",
    (answerKey, procedureId) => {
      const result = decision(decide({ [answerKey]: false }), procedureId);

      expect(result.status).toBe("DOES_NOT_APPLY");
      expect(result.missingInputs).toEqual([]);
      expect(procedureCategoryForDecision(result)).toBe("NOT_REQUIRED");
    },
  );

  it.each(installationFacilities)(
    "keeps an unanswered %s=null answer in confirmation",
    (answerKey, procedureId) => {
      const result = decision(decide({ [answerKey]: null }), procedureId);

      expect(result.status).toBe("NEEDS_MORE_INFO");
      expect(procedureCategoryForDecision(result)).toBe("CONFIRM");
    },
  );

  it("uses the reviewed integrated-permit parent to deem all three installation procedures", () => {
    const decisions = decide({
      integratedEnvironmentalPermitTarget: true,
      airEmissionFacility: true,
      waterDischargeFacility: true,
      noiseVibrationFacility: true,
    });

    expect(decision(decisions, "integrated-environmental-permit")).toMatchObject({
      status: "APPLIES",
      needsLegalReview: false,
    });
    expect(decision(decisions, "integrated-environmental-operation-start-report")).toMatchObject({
      status: "APPLIES",
      needsLegalReview: false,
    });
    for (const [, procedureId] of installationFacilities) {
      const result = decision(decisions, procedureId);
      expect(result.status, procedureId).toBe("DOES_NOT_APPLY");
      expect(result.isDeemed, procedureId).toBe(true);
      expect(procedureCategoryForDecision(result), procedureId).toBe("REQUIRED");
    }
    for (const procedureId of [
      "air-facility-operation-start-report",
      "water-facility-operation-start-report",
    ]) {
      const result = decision(decisions, procedureId);
      expect(result.status, procedureId).toBe("DOES_NOT_APPLY");
      expect(result.isDeemed, procedureId).toBe(true);
      expect(procedureCategoryForDecision(result), procedureId).toBe("REQUIRED");
    }
  });

  it("excludes an industrial-complex manufacturing factory from the noise installation procedure", () => {
    const result = decision(decide({
      insideIndustrialComplex: true,
      industryCategory: "GENERAL_MANUFACTURING",
      noiseVibrationFacility: true,
    }), "noise-vibration-facility-report");

    expect(result).toMatchObject({
      status: "DOES_NOT_APPLY",
      matchedRuleIds: ["rule-exp-noise-complex-exclusion"],
      isDeemed: false,
    });
    expect(procedureCategoryForDecision(result)).toBe("NOT_REQUIRED");
  });

  it("does not apply the manufacturing-factory complex exclusion to an AI data center", () => {
    const result = decision(decide({
      insideIndustrialComplex: true,
      industryCategory: "AI_DATA_CENTER",
      noiseVibrationFacility: true,
    }), "noise-vibration-facility-report");

    expect(result.matchedRuleIds).toEqual(["rule-exp-noise-vibration-facility-report"]);
    expect(result.provisionalEffect).toBe("INCLUDE");
    expect(procedureCategoryForDecision(result)).toBe("REQUIRED");
  });
});
