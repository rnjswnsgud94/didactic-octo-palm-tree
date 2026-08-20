import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";
import { scenarioAnswersToProjectInput } from "@/lib/domain/project-input";
import { resolveAllProcedures, resolveProcedure } from "@/lib/engine/rule-engine";

function decide(answers = catalog.scenarios[0].answers) {
  return resolveAllProcedures([...catalog.procedures], [...catalog.rules], scenarioAnswersToProjectInput(answers), catalog.coverage.catalogVersion);
}

function status(decisions: ReturnType<typeof decide>, id: string) {
  return decisions.find((decision) => decision.procedure.id === id)?.status;
}

describe("deterministic four-state rules", () => {
  it("removes the separate factory approval on the industrial-complex path", () => {
    const decisions = decide(catalog.scenarios[0].answers);
    expect(status(decisions, "industrial-complex-occupancy-contract")).toBe("APPLIES");
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
    expect(status(decisions, "industrial-complex-occupancy-contract")).toBe("NEEDS_MORE_INFO");
    expect(status(decisions, "air-emission-installation-permit")).toBe("NEEDS_MORE_INFO");
    expect(decisions.find((item) => item.procedure.id === "air-emission-installation-permit")?.missingInputs).toContain("environment.airEmissionFacility");
  });

  it("keeps unverified environmental law as POSSIBLY_APPLIES", () => {
    const decisions = decide(catalog.scenarios[2].answers);
    expect(status(decisions, "air-emission-installation-permit")).toBe("POSSIBLY_APPLIES");
    expect(status(decisions, "water-discharge-installation-permit")).toBe("POSSIBLY_APPLIES");
    expect(status(decisions, "process-safety-report")).toBe("APPLIES");
  });

  it("returns byte-for-byte stable decisions for identical inputs", () => {
    const first = decide(catalog.scenarios[2].answers);
    const second = decide(catalog.scenarios[2].answers);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("separates assessment dates before and after a rule takes effect", () => {
    const before = decide({ ...catalog.scenarios[0].answers, assessmentDate: "2026-06-30" });
    const after = decide({ ...catalog.scenarios[0].answers, assessmentDate: "2026-07-01" });
    expect(status(before, "industrial-complex-occupancy-contract")).toBe("POSSIBLY_APPLIES");
    expect(status(after, "industrial-complex-occupancy-contract")).toBe("APPLIES");
  });

  it("applies an exact regional rule only inside its jurisdiction", () => {
    const procedure = catalog.procedures.find((item) => item.id === "industrial-complex-occupancy-contract")!;
    const baseRule = catalog.rules.find((item) => item.id === "rule-occupancy-inside-complex")!;
    const regionalRule = { ...baseRule, id: "rule-test-cheongbuk-only", jurisdiction: { nationwide: false, provinces: ["충청북도"], cities: [], industrialComplexIds: [] } };
    const chungbuk = resolveProcedure(procedure, [regionalRule], scenarioAnswersToProjectInput(catalog.scenarios[0].answers), "test");
    const chungnam = resolveProcedure(procedure, [regionalRule], scenarioAnswersToProjectInput({ ...catalog.scenarios[0].answers, province: "충청남도", city: "천안시" }), "test");
    expect(chungbuk.status).toBe("APPLIES");
    expect(chungnam.status).toBe("POSSIBLY_APPLIES");
  });

  it("surfaces equal-priority include/exclude conflicts", () => {
    const procedure = catalog.procedures.find((item) => item.id === "industrial-complex-occupancy-contract")!;
    const baseRule = catalog.rules.find((item) => item.id === "rule-occupancy-inside-complex")!;
    const include = { ...baseRule, id: "rule-test-include", priority: 50 };
    const exclude = { ...baseRule, id: "rule-test-exclude", effect: "EXCLUDE" as const, priority: 50 };
    const decision = resolveProcedure(procedure, [include, exclude], scenarioAnswersToProjectInput(catalog.scenarios[0].answers), "test");
    expect(decision.status).toBe("POSSIBLY_APPLIES");
    expect(decision.conflictRuleIds).toEqual(["rule-test-exclude", "rule-test-include"]);
    expect(decision.reason).toContain("충돌");
  });
});
