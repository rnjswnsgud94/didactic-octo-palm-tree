import { describe, expect, it } from "vitest";

import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import { buildPlanningDurations } from "@/lib/data/planning-durations";

const baseAnswers = catalog.scenarios[0].answers;

function answers(overrides: Partial<ScenarioAnswers> = {}): ScenarioAnswers {
  return { ...baseAnswers, ...overrides };
}

function durationFor(
  procedureId: string,
  overrides: Partial<ScenarioAnswers> = {},
) {
  return buildPlanningDurations(
    catalog.procedures,
    catalog.durations,
    answers(overrides),
  ).find((duration) => duration.procedureId === procedureId);
}

describe("automatic planning durations", () => {
  it("keeps reviewed official values in their original units", () => {
    expect(
      durationFor("factory-establishment-approval", {
        permitCoordination: null,
      }),
    ).toMatchObject({
      minimum: 7,
      typical: 20,
      unit: "BUSINESS_DAY",
      overlapPolicy: "PRE_CONSTRUCTION",
      evidenceType: "OFFICIAL_SERVICE_STANDARD",
    });
    expect(durationFor("energy-use-plan-consultation")).toMatchObject({
      minimum: 30,
      typical: 30,
      unit: "CALENDAR_DAY",
    });
    expect(durationFor("traffic-impact-assessment")).toMatchObject({
      minimum: 3,
      typical: 3,
      unit: "MONTH",
    });
  });

  it("does not invent an automatic value when nationwide evidence is absent", () => {
    expect(durationFor("development-activity-completion-inspection")).toMatchObject({
      minimum: null,
      typical: null,
      unit: null,
      overlapPolicy: "PRE_OPERATION",
      releasePolicy: "CONSTRUCTION_FINISH",
      evidenceType: "INSUFFICIENT_DATA",
      confidence: "UNVERIFIED",
      sourceLabel: null,
    });
  });

  it.each([
    ["NONE", 7],
    ["LOCAL_ONLY", 14],
    ["OTHER_LT_20", 20],
    ["OTHER_GTE_20", 30],
  ])(
    "resolves the factory-establishment route for coordination=%s",
    (permitCoordination, expectedDays) => {
      expect(
        durationFor("factory-establishment-approval", {
          permitCoordination,
        }),
      ).toMatchObject({
        minimum: expectedDays,
        typical: expectedDays,
        unit: "BUSINESS_DAY",
      });
    },
  );

  it.each([
    [999, 7, 7],
    [1_000, 7, 14],
    [5_000, 10, 14],
    [30_000, 15, 25],
  ])(
    "resolves the building-permit route for total area %i m2",
    (totalAreaM2, expectedMinimum, expectedTypical) => {
      expect(durationFor("building-permit", { totalAreaM2 })).toMatchObject({
        minimum: expectedMinimum,
        typical: expectedTypical,
        unit: "BUSINESS_DAY",
      });
    },
  );

  it.each([
    ["DISASTER_IMPACT", 45],
    ["DISASTER_IMPACT_REVIEW", 30],
  ] as const)(
    "resolves the disaster consultation period for %s",
    (disasterImpactAssessmentType, expectedDays) => {
      expect(
        durationFor("disaster-impact-assessment-consultation", {
          disasterImpactAssessmentType,
        }),
      ).toMatchObject({
        minimum: expectedDays,
        typical: expectedDays,
        unit: "BUSINESS_DAY",
      });
    },
  );

  it("uses the reviewed generic disaster route while the subtype is unknown", () => {
    expect(
      durationFor("disaster-impact-assessment-consultation", {
        disasterImpactAssessmentType: null,
      }),
    ).toMatchObject({
      minimum: 20,
      typical: 30,
      unit: "BUSINESS_DAY",
    });
  });

  it("releases completion inspections only after construction finishes", () => {
    expect(durationFor("building-use-approval")).toMatchObject({
      overlapPolicy: "PRE_OPERATION",
      releasePolicy: "CONSTRUCTION_FINISH",
    });
    expect(durationFor("fire-facility-completion-inspection")).toMatchObject({
      overlapPolicy: "PRE_OPERATION",
      releasePolicy: "CONSTRUCTION_FINISH",
    });
  });
});
