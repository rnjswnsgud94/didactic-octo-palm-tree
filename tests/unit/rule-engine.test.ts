import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";
import { scenarioAnswersToProjectInput } from "@/lib/domain/project-input";
import { resolveAllProcedures, resolveProcedure } from "@/lib/engine/rule-engine";

function decide(answers = catalog.scenarios[0].answers) {
  const reviewedProcedures = catalog.procedures.map((procedure) => ({
    ...procedure,
    verificationStatus: "INTERNAL_REVIEWED" as const,
  }));
  const reviewedRules = catalog.rules.map((rule) => ({
    ...rule,
    status: rule.status === "RETIRED" ? rule.status : "INTERNAL_REVIEWED" as const,
  }));
  return resolveAllProcedures(reviewedProcedures, reviewedRules, scenarioAnswersToProjectInput(answers), catalog.coverage.catalogVersion);
}

function status(decisions: ReturnType<typeof decide>, id: string) {
  return decisions.find((decision) => decision.procedure.id === id)?.status;
}

function decision(decisions: ReturnType<typeof decide>, id: string) {
  return decisions.find((item) => item.procedure.id === id);
}

describe("deterministic four-state rules", () => {
  it("does not expose a non-permit contract on the industrial-complex path", () => {
    const decisions = decide(catalog.scenarios[0].answers);
    expect(status(decisions, "industrial-complex-occupancy-contract")).toBeUndefined();
    expect(status(decisions, "factory-establishment-approval")).toBe("DOES_NOT_APPLY");
    expect(status(decisions, "factory-completion-report-complex")).toBe("APPLIES");
    expect(status(decisions, "factory-completion-report-offsite")).toBe("DOES_NOT_APPLY");
  });

  it.each([
    [499, "NONE", "DOES_NOT_APPLY"],
    [499, "LOCAL_ONLY", "APPLIES"],
    [500, "NONE", "APPLIES"],
    [501, "NONE", "APPLIES"],
  ] as const)("handles the 500㎡ boundary: %i㎡ / %s", (totalAreaM2, permitCoordination, expected) => {
    const base = catalog.scenarios[2].answers;
    const decisions = decide({ ...base, totalAreaM2, increaseAreaM2: totalAreaM2, permitCoordination });
    expect(status(decisions, "factory-establishment-approval")).toBe(expected);
  });

  it("uses NEEDS_MORE_INFO instead of guessing from an unknown fact", () => {
    const decisions = decide(catalog.scenarios[3].answers);
    expect(status(decisions, "air-emission-installation-permit")).toBe("NEEDS_MORE_INFO");
    expect(decisions.find((item) => item.procedure.id === "air-emission-installation-permit")?.missingInputs).toContain("environment.airEmissionFacility");
  });

  it("replaces individual air and water permits with the integrated permit path", () => {
    const decisions = decide(catalog.scenarios[2].answers);
    expect(status(decisions, "integrated-environmental-permit")).toBe("APPLIES");
    expect(status(decisions, "integrated-environmental-operation-start-report")).toBe("APPLIES");
    expect(status(decisions, "air-emission-installation-permit")).toBe("DOES_NOT_APPLY");
    expect(status(decisions, "water-discharge-installation-permit")).toBe("DOES_NOT_APPLY");
    expect(status(decisions, "air-facility-operation-start-report")).toBe("DOES_NOT_APPLY");
    expect(status(decisions, "water-facility-operation-start-report")).toBe("DOES_NOT_APPLY");
    expect(status(decisions, "noise-vibration-facility-report")).toBe("DOES_NOT_APPLY");
    expect(decision(decisions, "air-emission-installation-permit")?.isDeemed).toBe(true);
    expect(decision(decisions, "water-discharge-installation-permit")?.isDeemed).toBe(true);
    expect(decision(decisions, "air-facility-operation-start-report")?.isDeemed).toBe(true);
    expect(decision(decisions, "water-facility-operation-start-report")?.isDeemed).toBe(true);
    expect(status(decisions, "process-safety-report")).toBe("APPLIES");
    expect(status(decisions, "hazard-prevention-plan")).toBe("DOES_NOT_APPLY");
    expect(decision(decisions, "hazard-prevention-plan")?.isDeemed).toBe(true);
  });

  it("does not label an unrelated exclusion as deemed", () => {
    const decisions = decide(catalog.scenarios[0].answers);
    expect(status(decisions, "noise-vibration-facility-report")).toBe("DOES_NOT_APPLY");
    expect(decision(decisions, "noise-vibration-facility-report")?.isDeemed).toBe(false);
  });

  it("uses explicit facility facts instead of industry or demand proxies", () => {
    const base = catalog.scenarios[1].answers;
    const excluded = decide({
      ...base,
      chemicalManufactureOrImport: false,
      privateElectricalFacilityWork: false,
      specificHighPressureGasUse: false,
    });
    expect(status(excluded, "chemical-substance-confirmation")).toBe("DOES_NOT_APPLY");
    expect(status(excluded, "private-electrical-facility-construction-plan")).toBe("DOES_NOT_APPLY");
    expect(status(excluded, "electrical-pre-use-inspection")).toBe("DOES_NOT_APPLY");
    expect(status(excluded, "specific-high-pressure-gas-use-report")).toBe("DOES_NOT_APPLY");

    const included = decide({
      ...base,
      chemicalManufactureOrImport: true,
      powerIncreaseMw: 0,
      privateElectricalFacilityWork: true,
      specificHighPressureGasUse: true,
    });
    expect(status(included, "chemical-substance-confirmation")).toBe("APPLIES");
    expect(status(included, "private-electrical-facility-construction-plan")).toBe("APPLIES");
    expect(status(included, "electrical-pre-use-inspection")).toBe("APPLIES");
    expect(status(included, "specific-high-pressure-gas-use-report")).toBe("APPLIES");
  });

  it("registers expanded exclusion rules on their procedures", () => {
    expect(decision(decide(), "air-facility-operation-start-report")?.procedure.ruleIds).toContain("rule-exp-air-operation-integrated-exclusion");
    expect(decision(decide(), "water-facility-operation-start-report")?.procedure.ruleIds).toContain("rule-exp-water-operation-integrated-exclusion");
    expect(decision(decide(), "hazard-prevention-plan")?.procedure.ruleIds).toContain("rule-exp-hazard-prevention-psm-exclusion");
  });

  it("uses factual land and safety inputs for the expanded permit paths", () => {
    const answers = {
      ...catalog.scenarios[2].answers,
      landCategory: "FARMLAND" as const,
      integratedEnvironmentalPermitTarget: false,
    };
    const decisions = decide(answers);
    expect(status(decisions, "farmland-conversion-permit")).toBe("APPLIES");
    expect(status(decisions, "small-environmental-impact-assessment")).toBe("APPLIES");
    expect(status(decisions, "hazardous-chemical-business-permit")).toBe("APPLIES");
    expect(status(decisions, "hazardous-materials-facility-installation-permit")).toBe("APPLIES");
    expect(status(decisions, "high-pressure-gas-manufacture-storage-permit-report")).toBe("APPLIES");
  });

  it("requires authority confirmation for added paths whose broad inputs are insufficient", () => {
    const base = catalog.scenarios[1].answers;
    const included = decide({
      ...base,
      wastewaterM3Day: 1500,
      landCategory: "FOREST" as const,
      highPressureGas: true,
      fireFacilityWork: true,
    });
    expect(status(included, "middle-water-installation-report")).toBe("APPLIES");
    for (const id of [
      "high-pressure-gas-business-start-report",
      "fire-work-supervisor-designation-report",
      "fire-facility-first-self-inspection-report",
      "forestland-restoration-design-approval",
      "forestland-restoration-completion-inspection",
    ]) {
      expect(status(included, id), id).toBe("NEEDS_MORE_INFO");
      expect(decision(included, id)?.provisionalEffect, id).toBeNull();
      expect(decision(included, id)?.missingInputs[0], id).toMatch(/^confirmation\./);
    }

    const belowMiddleWaterThreshold = decide({ ...base, wastewaterM3Day: 1499 });
    expect(status(belowMiddleWaterThreshold, "middle-water-installation-report")).toBe("DOES_NOT_APPLY");
  });

  it("returns byte-for-byte stable decisions for identical inputs", () => {
    const first = decide(catalog.scenarios[2].answers);
    const second = decide(catalog.scenarios[2].answers);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("separates assessment dates before and after a rule takes effect", () => {
    const before = decide({ ...catalog.scenarios[2].answers, assessmentDate: "2026-06-30" });
    const after = decide({ ...catalog.scenarios[2].answers, assessmentDate: "2026-07-01" });
    expect(status(before, "factory-establishment-approval")).toBe("POSSIBLY_APPLIES");
    expect(status(after, "factory-establishment-approval")).toBe("APPLIES");
  });

  it("applies an exact regional rule only inside its jurisdiction", () => {
    const procedure = {
      ...catalog.procedures.find((item) => item.id === "building-permit")!,
      verificationStatus: "INTERNAL_REVIEWED" as const,
    };
    const baseRule = catalog.rules.find((item) => item.id === "rule-building-action")!;
    const regionalRule = { ...baseRule, id: "rule-test-cheongbuk-only", status: "INTERNAL_REVIEWED" as const, jurisdiction: { nationwide: false, provinces: ["충청북도"], cities: [], industrialComplexIds: [] } };
    const chungbuk = resolveProcedure(procedure, [regionalRule], scenarioAnswersToProjectInput(catalog.scenarios[0].answers), "test");
    const chungnam = resolveProcedure(procedure, [regionalRule], scenarioAnswersToProjectInput({ ...catalog.scenarios[0].answers, province: "충청남도", city: "천안시" }), "test");
    expect(chungbuk.status).toBe("APPLIES");
    expect(chungnam.status).toBe("POSSIBLY_APPLIES");
  });

  it("surfaces equal-priority include/exclude conflicts", () => {
    const procedure = catalog.procedures.find((item) => item.id === "building-permit")!;
    const baseRule = catalog.rules.find((item) => item.id === "rule-building-action")!;
    const include = { ...baseRule, id: "rule-test-include", priority: 50 };
    const exclude = { ...baseRule, id: "rule-test-exclude", effect: "EXCLUDE" as const, priority: 50 };
    const decision = resolveProcedure(procedure, [include, exclude], scenarioAnswersToProjectInput(catalog.scenarios[0].answers), "test");
    expect(decision.status).toBe("POSSIBLY_APPLIES");
    expect(decision.conflictRuleIds).toEqual(["rule-test-exclude", "rule-test-include"]);
    expect(decision.reason).toContain("충돌");
  });

  it("separates deterministic draft matches from their legal-review disclosure", () => {
    const baseProcedure = catalog.procedures.find((item) => item.id === "building-permit")!;
    const procedure = { ...baseProcedure, verificationStatus: "INTERNAL_REVIEWED" as const };
    const baseRule = catalog.rules.find((item) => item.id === "rule-building-action")!;
    const input = scenarioAnswersToProjectInput(catalog.scenarios[0].answers);

    const draftInclude = resolveProcedure(
      procedure,
      [{ ...baseRule, status: "DRAFT" as const }],
      input,
      "test",
    );
    const draftExclude = resolveProcedure(
      procedure,
      [{ ...baseRule, id: "rule-test-draft-exclude", effect: "EXCLUDE" as const, status: "DRAFT" as const }],
      input,
      "test",
    );
    const reviewedInclude = resolveProcedure(
      procedure,
      [{ ...baseRule, status: "INTERNAL_REVIEWED" as const }],
      input,
      "test",
    );

    expect(draftInclude.status).toBe("POSSIBLY_APPLIES");
    expect(draftInclude.provisionalEffect).toBe("INCLUDE");
    expect(draftInclude.needsLegalReview).toBe(true);
    expect(draftInclude.legalReviewReasons.join(" ")).toContain(baseRule.id);
    expect(draftInclude.reason).toContain("세부 법률검토");
    expect(draftExclude.status).toBe("POSSIBLY_APPLIES");
    expect(draftExclude.provisionalEffect).toBe("EXCLUDE");
    expect(draftExclude.needsLegalReview).toBe(true);
    expect(draftExclude.legalReviewReasons.join(" ")).toContain("rule-test-draft-exclude");
    expect(reviewedInclude.status).toBe("APPLIES");
    expect(reviewedInclude.needsLegalReview).toBe(false);
    expect(reviewedInclude.legalReviewReasons).toEqual([]);
  });

  it("keeps procedure-detail review warnings visibly downgraded", () => {
    const procedure = catalog.procedures.find((item) => item.id === "building-permit")!;
    const baseRule = catalog.rules.find((item) => item.id === "rule-building-action")!;
    const result = resolveProcedure(
      procedure,
      [{ ...baseRule, status: "INTERNAL_REVIEWED" as const }],
      scenarioAnswersToProjectInput(catalog.scenarios[0].answers),
      "test",
    );

    expect(result.status).toBe("POSSIBLY_APPLIES");
    expect(result.provisionalEffect).toBe("INCLUDE");
    expect(result.needsLegalReview).toBe(true);
    expect(result.legalReviewReasons.join(" ")).toContain("AI 보조 초안");
  });

  it("keeps an unknown draft condition in the additional-information bucket", () => {
    const procedure = catalog.procedures.find((item) => item.id === "air-emission-installation-permit")!;
    const rule = catalog.rules.find((item) => item.id === "rule-air-emission-facility")!;
    const result = resolveProcedure(
      procedure,
      [rule],
      scenarioAnswersToProjectInput(catalog.scenarios[3].answers),
      "test",
    );

    expect(result.status).toBe("NEEDS_MORE_INFO");
    expect(result.missingInputs).toContain("environment.airEmissionFacility");
    expect(result.needsLegalReview).toBe(true);
    expect(result.legalReviewReasons.join(" ")).toContain(rule.id);
  });

  it("preserves a deterministic planning direction while keeping draft production matches downgraded", () => {
    const decisions = resolveAllProcedures(
      [...catalog.procedures],
      [...catalog.rules],
      scenarioAnswersToProjectInput(catalog.scenarios[0].answers),
      catalog.coverage.catalogVersion,
    );
    const building = decision(decisions, "building-permit");

    expect(building?.status).toBe("POSSIBLY_APPLIES");
    expect(building?.provisionalEffect).toBe("INCLUDE");
    expect(building?.needsLegalReview).toBe(true);
    expect(building?.legalReviewReasons.join(" ")).toContain("rule-building-action");
  });
});
