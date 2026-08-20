import { describe, expect, it } from "vitest";

import type { DurationEstimate, ProcedureEdge } from "@/lib/domain/schemas";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import { calculateSchedule } from "@/lib/engine/schedule";

function decisions(
  ids: string[],
  matchedRuleIdsByProcedure: Record<string, string[]> = {},
): ProcedureDecision[] {
  return ids.map((id) => ({
    status: "APPLIES",
    procedure: { id },
    matchedRuleIds: matchedRuleIdsByProcedure[id] ?? [],
  })) as ProcedureDecision[];
}

function durations(values: Record<string, number | null>): DurationEstimate[] {
  return Object.entries(values).map(([procedureId, value]) => ({
    procedureId,
    elapsed: value === null ? null : { min: value, base: value, max: value, unit: "BUSINESS_DAY" },
  })) as DurationEstimate[];
}

function edge(id: string, from: string, to: string, strength: ProcedureEdge["strength"] = "LEGAL_HARD"): ProcedureEdge {
  return { id, from, to, relation: "FINISH_TO_START", lag: 0, lagUnit: "BUSINESS_DAY", strength, conditionRuleId: null, citationIds: [], branchId: null, note: "test" };
}

describe("DAG and critical path", () => {
  it("preserves parallel paths and computes slack", () => {
    const result = calculateSchedule({
      decisions: decisions(["a", "b", "c"]),
      edges: [edge("a-c", "a", "c"), edge("b-c", "b", "c")],
      durations: durations({ a: 5, b: 3, c: 2 }),
      scenario: "BASE",
      includeConditional: true,
      includePractical: true,
    });
    expect(result.total).toBe(7);
    expect(result.criticalProcedureIds).toEqual(["a", "c"]);
    expect(result.nodes.find((node) => node.procedureId === "b")?.slack).toBe(2);
  });

  it("marks calculations incomplete instead of filling unknown duration", () => {
    const result = calculateSchedule({ decisions: decisions(["a"]), edges: [], durations: durations({ a: null }), scenario: "BASE", includeConditional: true, includePractical: true });
    expect(result.complete).toBe(false);
    expect(result.unknownDurationProcedureIds).toEqual(["a"]);
    expect(result.warnings.join(" ")).toContain("0일로 가정한 부분 계산");
  });

  it("can exclude practical dependencies", () => {
    const practical = edge("a-b", "a", "b", "PRACTICAL");
    const withPractical = calculateSchedule({ decisions: decisions(["a", "b"]), edges: [practical], durations: durations({ a: 5, b: 3 }), scenario: "BASE", includeConditional: true, includePractical: true });
    const legalOnly = calculateSchedule({ decisions: decisions(["a", "b"]), edges: [practical], durations: durations({ a: 5, b: 3 }), scenario: "BASE", includeConditional: true, includePractical: false });
    expect(withPractical.total).toBe(8);
    expect(legalOnly.total).toBe(5);
  });

  it("activates a conditioned edge only when its rule actually matched", () => {
    const conditioned = {
      ...edge("a-b", "a", "b"),
      conditionRuleId: "rule-a",
    };
    const withoutMatch = calculateSchedule({
      decisions: decisions(["a", "b"]),
      edges: [conditioned],
      durations: durations({ a: 5, b: 3 }),
      scenario: "BASE",
      includeConditional: true,
      includePractical: true,
    });
    const withMatch = calculateSchedule({
      decisions: decisions(["a", "b"], { a: ["rule-a"] }),
      edges: [conditioned],
      durations: durations({ a: 5, b: 3 }),
      scenario: "BASE",
      includeConditional: true,
      includePractical: true,
    });
    expect(withoutMatch.total).toBe(5);
    expect(withMatch.total).toBe(8);
    expect(withMatch.topologicalOrder.indexOf("a")).toBeLessThan(
      withMatch.topologicalOrder.indexOf("b"),
    );
  });

  it("rejects cycles", () => {
    expect(() => calculateSchedule({ decisions: decisions(["a", "b"]), edges: [edge("a-b", "a", "b"), edge("b-a", "b", "a")], durations: durations({ a: 1, b: 1 }), scenario: "BASE", includeConditional: true, includePractical: true })).toThrow("순환");
  });

  it("does not silently convert calendar days to business days", () => {
    const calendarDuration = [{ procedureId: "a", elapsed: { min: 10, base: 10, max: 10, unit: "CALENDAR_DAY" } }] as DurationEstimate[];
    const result = calculateSchedule({ decisions: decisions(["a"]), edges: [], durations: calendarDuration, scenario: "BASE", includeConditional: true, includePractical: true });
    expect(result.total).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.unknownDurationProcedureIds).toEqual(["a"]);
  });
});
