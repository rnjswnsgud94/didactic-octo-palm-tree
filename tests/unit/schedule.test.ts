import { describe, expect, it } from "vitest";

import type { DurationEstimate, ProcedureEdge } from "@/lib/domain/schemas";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import {
  calculateSchedule,
  type ConstructionPlan,
  type PlanningDuration,
} from "@/lib/engine/schedule";

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

type DurationValue = number | null | [minimum: number, typical: number];

function durations(values: Record<string, DurationValue>): DurationEstimate[] {
  return Object.entries(values).map(([procedureId, value]) => {
    const minimum = Array.isArray(value) ? value[0] : value;
    const typical = Array.isArray(value) ? value[1] : value;
    return {
      procedureId,
      elapsed:
        value === null
          ? null
          : {
              min: minimum,
              base: typical,
              max: typical,
              unit: "BUSINESS_DAY",
            },
    } as DurationEstimate;
  });
}

function edge(
  id: string,
  from: string,
  to: string,
  options: Partial<
    Pick<ProcedureEdge, "relation" | "lag" | "lagUnit" | "strength" | "conditionRuleId">
  > = {},
): ProcedureEdge {
  return {
    id,
    from,
    to,
    relation: options.relation ?? "FINISH_TO_START",
    lag: options.lag ?? 0,
    lagUnit: options.lagUnit ?? "BUSINESS_DAY",
    strength: options.strength ?? "LEGAL_HARD",
    conditionRuleId: options.conditionRuleId ?? null,
    citationIds: [],
    branchId: null,
    note: "test",
  };
}

type PlanningSpec = {
  minimum: number | null;
  typical?: number | null;
  unit: PlanningDuration["unit"];
  overlapPolicy: PlanningDuration["overlapPolicy"];
  releasePolicy?: PlanningDuration["releasePolicy"];
};

function planning(values: Record<string, PlanningSpec>): PlanningDuration[] {
  return Object.entries(values).map(([procedureId, value]) => {
    const typical = value.typical === undefined ? value.minimum : value.typical;
    const known = value.minimum !== null || typical !== null;
    return {
      procedureId,
      minimum: value.minimum,
      typical,
      unit: value.unit,
      overlapPolicy: value.overlapPolicy,
      releasePolicy: value.releasePolicy ?? "EARLIEST_ALLOWED",
      evidenceType: known
        ? "OFFICIAL_SERVICE_STANDARD"
        : "INSUFFICIENT_DATA",
      confidence: known ? "HIGH" : "UNVERIFIED",
      sourceLabel: known ? "테스트용 공식 처리기간" : null,
      assumptions: [],
      reviewedAt: known ? "2026-01-01" : null,
    } satisfies PlanningDuration;
  });
}

const constructionPlan: ConstructionPlan = {
  assessmentDate: "2026-01-02",
  plannedStartDate: "2026-02-01",
  plannedEndDate: "2026-05-31",
};

describe("business-day DAG and critical path", () => {
  it("uses the longest dependency path instead of summing parallel work", () => {
    const result = calculateSchedule({
      decisions: decisions(["a", "b", "c"]),
      edges: [edge("a-c", "a", "c"), edge("b-c", "b", "c")],
      durations: durations({ a: 5, b: 3, c: 2 }),
      scenario: "TYPICAL",
      includeConditional: true,
      includePractical: true,
    });

    expect(result.total).toBe(7);
    expect(result.criticalProcedureIds).toEqual(["a", "c"]);
    expect(result.nodes.find((node) => node.procedureId === "b")?.slack).toBe(2);
  });

  it("keeps MIN and TYPICAL official values distinct", () => {
    const common = {
      decisions: decisions(["permit"]),
      edges: [],
      durations: durations({ permit: [7, 20] }),
      includeConditional: true,
      includePractical: true,
    };

    expect(calculateSchedule({ ...common, scenario: "MIN" }).total).toBe(7);
    expect(calculateSchedule({ ...common, scenario: "TYPICAL" }).total).toBe(20);
  });

  it("marks a missing official duration as an incomplete partial path", () => {
    const result = calculateSchedule({
      decisions: decisions(["unknown"]),
      edges: [],
      durations: durations({ unknown: null }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
    });

    expect(result.complete).toBe(false);
    expect(result.unknownDurationProcedureIds).toEqual(["unknown"]);
    expect(result.warnings.join(" ")).toContain("부분 계산");
  });

  it("can exclude practical dependencies without changing legal edges", () => {
    const practical = edge("a-b", "a", "b", { strength: "PRACTICAL" });
    const common = {
      decisions: decisions(["a", "b"]),
      edges: [practical],
      durations: durations({ a: 5, b: 3 }),
      scenario: "MIN" as const,
      includeConditional: true,
    };

    expect(calculateSchedule({ ...common, includePractical: true }).total).toBe(8);
    expect(calculateSchedule({ ...common, includePractical: false }).total).toBe(5);
  });

  it("activates a conditioned edge only when its rule matched", () => {
    const conditioned = edge("a-b", "a", "b", {
      conditionRuleId: "rule-a",
    });
    const common = {
      edges: [conditioned],
      durations: durations({ a: 5, b: 3 }),
      scenario: "MIN" as const,
      includeConditional: true,
      includePractical: true,
    };

    expect(
      calculateSchedule({ ...common, decisions: decisions(["a", "b"]) }).total,
    ).toBe(5);
    expect(
      calculateSchedule({
        ...common,
        decisions: decisions(["a", "b"], { a: ["rule-a"] }),
      }).total,
    ).toBe(8);
  });

  it("does not schedule a provisional draft exclusion", () => {
    const excluded = {
      ...decisions(["excluded"])[0],
      status: "POSSIBLY_APPLIES",
      provisionalEffect: "EXCLUDE",
    } as ProcedureDecision;
    const result = calculateSchedule({
      decisions: [excluded],
      edges: [],
      durations: durations({ excluded: 5 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
    });

    expect(result.topologicalOrder).toEqual([]);
    expect(result.nodes).toEqual([]);
  });

  it("rejects a cyclic selected graph", () => {
    expect(() =>
      calculateSchedule({
        decisions: decisions(["a", "b"]),
        edges: [edge("a-b", "a", "b"), edge("b-a", "b", "a")],
        durations: durations({ a: 1, b: 1 }),
        scenario: "MIN",
        includeConditional: true,
        includePractical: true,
      }),
    ).toThrow("순환");
  });
});

describe("automatic integrated construction timeline", () => {
  it("uses MIN and TYPICAL business-day paths to adjust construction", () => {
    const common = {
      decisions: decisions(["permit"]),
      edges: [],
      durations: durations({ permit: [5, 20] }),
      includeConditional: true,
      includePractical: true,
      constructionPlan: {
        assessmentDate: "2026-01-15",
        plannedStartDate: "2026-02-01",
        plannedEndDate: "2026-03-31",
      },
      planningDurations: planning({
        permit: {
          minimum: 5,
          typical: 20,
          unit: "BUSINESS_DAY",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
      }),
    };

    const minimum = calculateSchedule({ ...common, scenario: "MIN" });
    const typical = calculateSchedule({ ...common, scenario: "TYPICAL" });

    expect(minimum.projectTimeline).toMatchObject({
      adjustedConstructionStartDate: "2026-02-01",
      constructionCompletionDate: "2026-03-31",
      operationReadyDate: "2026-03-31",
      totalCalendarDays: 76,
      permitLeadCalendarDays: 7,
      constructionDelayCalendarDays: 0,
    });
    expect(typical.projectTimeline).toMatchObject({
      adjustedConstructionStartDate: "2026-02-12",
      constructionCompletionDate: "2026-04-11",
      operationReadyDate: "2026-04-11",
      totalCalendarDays: 87,
      permitLeadCalendarDays: 28,
      constructionDelayCalendarDays: 11,
    });
    expect(
      minimum.projectTimeline?.nodes.find((node) => node.procedureId === "permit"),
    ).toMatchObject({ processingDuration: 5, finishDate: "2026-01-21" });
    expect(
      typical.projectTimeline?.nodes.find((node) => node.procedureId === "permit"),
    ).toMatchObject({ processingDuration: 20, finishDate: "2026-02-11" });
  });

  it("calculates business-day, calendar-day and month durations without unit approximation", () => {
    const result = calculateSchedule({
      decisions: decisions(["business", "calendar", "month"]),
      edges: [
        edge("business-calendar", "business", "calendar"),
        edge("calendar-month", "calendar", "month"),
      ],
      durations: durations({ business: 1, calendar: 1, month: 1 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan: {
        assessmentDate: "2026-01-02",
        plannedStartDate: "2026-07-01",
        plannedEndDate: "2026-08-31",
      },
      planningDurations: planning({
        business: {
          minimum: 2,
          unit: "BUSINESS_DAY",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
        calendar: {
          minimum: 3,
          unit: "CALENDAR_DAY",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
        month: {
          minimum: 1,
          unit: "MONTH",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
      }),
    });

    const nodes = new Map(
      result.projectTimeline?.nodes.map((node) => [node.procedureId, node]),
    );
    expect(nodes.get("business")).toMatchObject({
      startDate: "2026-01-02",
      finishDate: "2026-01-05",
      processingUnit: "BUSINESS_DAY",
    });
    expect(nodes.get("calendar")).toMatchObject({
      startDate: "2026-01-06",
      finishDate: "2026-01-08",
      processingUnit: "CALENDAR_DAY",
    });
    expect(nodes.get("month")).toMatchObject({
      startDate: "2026-01-09",
      finishDate: "2026-02-08",
      processingUnit: "MONTH",
    });
    expect(result.projectTimeline?.permitLeadCalendarDays).toBe(38);
  });

  it("clamps month-based durations to the last day of shorter months", () => {
    const result = calculateSchedule({
      decisions: decisions(["month-end"]),
      edges: [],
      durations: durations({ "month-end": 1 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan: {
        assessmentDate: "2026-01-31",
        plannedStartDate: "2026-06-01",
        plannedEndDate: "2026-12-31",
      },
      planningDurations: planning({
        "month-end": {
          minimum: 1,
          unit: "MONTH",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
      }),
    });

    expect(result.projectTimeline?.nodes[0]).toMatchObject({
      startDate: "2026-01-31",
      finishDate: "2026-02-27",
      processingUnit: "MONTH",
    });
  });

  it("moves construction and completion when pre-construction work overruns the plan", () => {
    const result = calculateSchedule({
      decisions: decisions(["permit"]),
      edges: [],
      durations: durations({ permit: 1 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan: {
        assessmentDate: "2026-01-02",
        plannedStartDate: "2026-02-01",
        plannedEndDate: "2026-03-31",
      },
      planningDurations: planning({
        permit: {
          minimum: 3,
          unit: "MONTH",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
      }),
    });

    expect(result.projectTimeline).toMatchObject({
      plannedConstructionStartDate: "2026-02-01",
      plannedConstructionEndDate: "2026-03-31",
      adjustedConstructionStartDate: "2026-04-02",
      constructionCompletionDate: "2026-05-30",
      operationReadyDate: "2026-05-30",
      constructionCalendarDays: 59,
      constructionDelayCalendarDays: 60,
      totalCalendarDays: 149,
    });
  });

  it("absorbs a during-construction procedure that finishes before completion", () => {
    const result = calculateSchedule({
      decisions: decisions(["during"]),
      edges: [],
      durations: durations({ during: 20 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan,
      planningDurations: planning({
        during: {
          minimum: 20,
          unit: "BUSINESS_DAY",
          overlapPolicy: "DURING_CONSTRUCTION",
        },
      }),
    });

    expect(result.projectTimeline).toMatchObject({
      constructionCompletionDate: "2026-05-31",
      operationReadyDate: "2026-05-31",
      totalCalendarDays: 150,
      absorbedByConstructionCalendarDays: 33,
    });
    expect(
      result.projectTimeline?.nodes.find((node) => node.procedureId === "during"),
    ).toMatchObject({
      startDate: "2026-02-01",
      finishDate: "2026-03-05",
      overlapsConstruction: true,
      overlapWithConstructionDays: 33,
      extendsOperationReady: false,
    });
  });

  it("starts a completion inspection after construction and extends operation readiness", () => {
    const result = calculateSchedule({
      decisions: decisions(["inspection"]),
      edges: [],
      durations: durations({ inspection: 5 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan,
      planningDurations: planning({
        inspection: {
          minimum: 5,
          unit: "BUSINESS_DAY",
          overlapPolicy: "PRE_OPERATION",
          releasePolicy: "CONSTRUCTION_FINISH",
        },
      }),
    });

    expect(result.projectTimeline).toMatchObject({
      constructionCompletionDate: "2026-05-31",
      operationReadyDate: "2026-06-05",
      totalCalendarDays: 155,
    });
    expect(
      result.projectTimeline?.nodes.find(
        (node) => node.procedureId === "inspection",
      ),
    ).toMatchObject({
      startDate: "2026-06-01",
      finishDate: "2026-06-05",
      overlapsConstruction: false,
      extendsOperationReady: true,
    });
  });

  it("dates post-operation work separately from the operation-ready total", () => {
    const result = calculateSchedule({
      decisions: decisions(["inspection", "report"]),
      edges: [edge("inspection-report", "inspection", "report")],
      durations: durations({ inspection: 5, report: 1 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan,
      planningDurations: planning({
        inspection: {
          minimum: 5,
          unit: "BUSINESS_DAY",
          overlapPolicy: "PRE_OPERATION",
          releasePolicy: "CONSTRUCTION_FINISH",
        },
        report: {
          minimum: 1,
          unit: "MONTH",
          overlapPolicy: "POST_OPERATION",
          releasePolicy: "OPERATION_READY",
        },
      }),
    });

    expect(result.projectTimeline).toMatchObject({
      operationReadyDate: "2026-06-05",
      postOperationCompletionDate: "2026-07-05",
      totalCalendarDays: 155,
      postOperationProcedureIds: ["report"],
    });
    expect(
      result.projectTimeline?.nodes.find((node) => node.procedureId === "report"),
    ).toMatchObject({
      startDate: "2026-06-06",
      finishDate: "2026-07-05",
      excludedFromOperationReady: true,
    });
  });

  it("returns null total and a visible schedule floor for an unknown blocking duration", () => {
    const result = calculateSchedule({
      decisions: decisions(["unknown"]),
      edges: [],
      durations: durations({ unknown: null }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan,
      planningDurations: planning({
        unknown: {
          minimum: null,
          typical: null,
          unit: null,
          overlapPolicy: "PRE_OPERATION",
          releasePolicy: "CONSTRUCTION_FINISH",
        },
      }),
    });

    expect(result.projectTimeline).toMatchObject({
      durationStatus: "MINIMUM_ONLY",
      complete: false,
      totalCalendarDays: null,
      operationReadyDate: null,
      minimumKnownCompletionDate: "2026-05-31",
      minimumKnownCalendarDays: 150,
      unknownPlanningDurationProcedureIds: ["unknown"],
    });
    expect(result.projectTimeline?.warnings.join(" ")).toContain("일정 하한");
  });

  it("does not calculate beyond the reviewed business-calendar coverage", () => {
    const result = calculateSchedule({
      decisions: decisions(["permit"]),
      edges: [],
      durations: durations({ permit: 40 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan: {
        assessmentDate: "2040-12-01",
        plannedStartDate: "2040-12-01",
        plannedEndDate: "2040-12-31",
      },
      planningDurations: planning({
        permit: {
          minimum: 40,
          unit: "BUSINESS_DAY",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
      }),
    });

    expect(result.projectTimeline).toMatchObject({
      durationStatus: "MINIMUM_ONLY",
      totalCalendarDays: null,
      operationReadyDate: null,
    });
    expect(result.projectTimeline?.warnings.join(" ")).toContain(
      "공휴일 달력 지원범위",
    );
  });

  it.each([
    [{ ...constructionPlan, assessmentDate: "2026-02-30" }, "유효한 평가일"],
    [{ ...constructionPlan, plannedStartDate: "2026-13-01" }, "공사 시작일·완료일"],
    [
      {
        ...constructionPlan,
        plannedStartDate: "2026-06-01",
        plannedEndDate: "2026-05-31",
      },
      "빠를 수 없습니다",
    ],
  ])("rejects an invalid construction plan", (invalidPlan, warning) => {
    const result = calculateSchedule({
      decisions: decisions(["permit"]),
      edges: [],
      durations: durations({ permit: 5 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan: invalidPlan,
      planningDurations: planning({
        permit: {
          minimum: 5,
          unit: "BUSINESS_DAY",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
      }),
    });

    expect(result.projectTimeline).toBeNull();
    expect(result.total).toBe(5);
    expect(result.warnings.join(" ")).toContain(warning);
  });

  it("calculates a daily plan that starts before the legal assessment date", () => {
    const result = calculateSchedule({
      decisions: decisions(["permit"]),
      edges: [],
      durations: durations({ permit: 5 }),
      scenario: "MIN",
      includeConditional: true,
      includePractical: true,
      constructionPlan: {
        assessmentDate: "2026-08-21",
        plannedStartDate: "2025-01-01",
        plannedEndDate: "2025-12-31",
      },
      planningDurations: planning({
        permit: {
          minimum: 5,
          unit: "BUSINESS_DAY",
          overlapPolicy: "PRE_CONSTRUCTION",
        },
      }),
    });

    expect(result.projectTimeline).toMatchObject({
      projectStartDate: "2025-01-01",
      plannedConstructionStartDate: "2025-01-01",
      plannedConstructionEndDate: "2025-12-31",
      constructionCalendarDays: 365,
    });
    expect(result.projectTimeline?.warnings.join(" ")).toContain("검토 기준일보다 빠르므로");
  });

  it("detects a cycle present only in the integrated mixed-unit graph", () => {
    expect(() =>
      calculateSchedule({
        decisions: decisions(["a", "b"]),
        edges: [
          edge("a-b", "a", "b", { lagUnit: "MONTH" }),
          edge("b-a", "b", "a", { lagUnit: "MONTH" }),
        ],
        durations: durations({ a: 1, b: 1 }),
        scenario: "MIN",
        includeConditional: true,
        includePractical: true,
        constructionPlan,
        planningDurations: planning({
          a: {
            minimum: 1,
            unit: "MONTH",
            overlapPolicy: "PRE_CONSTRUCTION",
          },
          b: {
            minimum: 1,
            unit: "MONTH",
            overlapPolicy: "PRE_CONSTRUCTION",
          },
        }),
      }),
    ).toThrow("순환");
  });
});
