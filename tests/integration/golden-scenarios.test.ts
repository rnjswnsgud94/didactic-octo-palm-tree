import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";
import { evaluateProject } from "@/lib/engine/pipeline";

describe("golden manufacturing scenarios", () => {
  it.each(catalog.scenarios.map((scenario) => [scenario.id, scenario.answers] as const))("evaluates %s without conflicts or cycles", (_id, answers) => {
    const result = evaluateProject(answers);
    expect(result.decisions).toHaveLength(catalog.procedures.length);
    expect(result.decisions.flatMap((decision) => decision.conflictRuleIds)).toEqual([]);
    expect(result.schedules.BASE.topologicalOrder.length).toBeGreaterThan(0);
    expect(result.schedules.BASE.warnings.join(" ")).toContain("총 사업기간");
  });

  it("switches mutually exclusive completion branches", () => {
    const complex = evaluateProject(catalog.scenarios[1].answers);
    const offsite = evaluateProject(catalog.scenarios[2].answers);
    const byId = (result: typeof complex, id: string) => result.decisions.find((decision) => decision.procedure.id === id)?.status;
    expect(byId(complex, "factory-completion-report-complex")).toBe("APPLIES");
    expect(byId(complex, "factory-completion-report-offsite")).toBe("DOES_NOT_APPLY");
    expect(byId(offsite, "factory-completion-report-complex")).toBe("DOES_NOT_APPLY");
    expect(byId(offsite, "factory-completion-report-offsite")).toBe("APPLIES");
  });

  it("keeps minimum, base and maximum schedule scenarios distinct", () => {
    const result = evaluateProject(catalog.scenarios[2].answers);
    expect(result.schedules.MIN.total).toBeLessThanOrEqual(result.schedules.BASE.total);
    expect(result.schedules.BASE.total).toBeLessThanOrEqual(result.schedules.MAX.total);
    expect(result.schedules.MIN.total).not.toBe(result.schedules.MAX.total);
  });
});
