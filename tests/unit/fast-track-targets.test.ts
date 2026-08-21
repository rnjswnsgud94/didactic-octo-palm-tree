import { describe, expect, it } from "vitest";

import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import {
  filterFastTrackTargetProcedureIds,
  getFastTrackTargetProcedureIds,
  industrialComplexPlanDeemedProcedureIds,
  regionalSpecialZoneDeemedProcedureIds,
} from "@/lib/data/special-law-processes";
import { evaluateProject } from "@/lib/engine/pipeline";
import { decodeShareState, encodeShareState } from "@/lib/share-state";

const fastTrackPrefixes = [
  "advanced-strategic-industry-fast-track",
  "semiconductor-cluster-fast-track",
] as const;

function answers(overrides: Partial<ScenarioAnswers>): ScenarioAnswers {
  return {
    ...catalog.scenarios[0].answers,
    assessmentDate: "2026-08-21",
    province: "충청남도",
    city: "아산시",
    industryCategory: "SECONDARY_BATTERY_CHEMICAL",
    aiDataCenterActFacilityConfirmed: null,
    appliedSpecialLawIds: [],
    insideIndustrialComplex: false,
    advancedStrategicIndustryFastTrackConfirmed: true,
    advancedStrategicIndustryApplicantRoleConfirmed: true,
    advancedStrategicIndustryDelayRiskConfirmed: true,
    advancedStrategicIndustryCommitteeResolved: true,
    advancedStrategicIndustryMinisterRequestDate: "2026-08-15",
    advancedStrategicIndustryFastTrackPermitIds: [
      "air-emission-installation-permit",
    ],
    airEmissionFacility: true,
    integratedEnvironmentalPermitTarget: false,
    ...overrides,
  };
}

function decision(
  evaluation: ReturnType<typeof evaluateProject>,
  procedureId: string,
) {
  const found = evaluation.decisions.find(
    (item) => item.procedure.id === procedureId,
  );
  expect(found, procedureId).toBeDefined();
  return found!;
}

describe("special-law fast-track target catalog", () => {
  it("generates request rules and edges for every eligible current-catalog procedure", () => {
    const targetProcedureIds = getFastTrackTargetProcedureIds(
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
      catalog.procedures,
    );

    expect(targetProcedureIds).toContain("air-emission-installation-permit");
    expect(targetProcedureIds).toContain("landscape-review");
    expect(targetProcedureIds).toContain("building-use-approval");
    expect(targetProcedureIds).toContain("energy-use-plan-consultation");
    expect(targetProcedureIds).toContain(
      "public-water-implementation-plan-approval-report",
    );
    expect(targetProcedureIds).not.toContain("road-connection-permit");
    expect(targetProcedureIds).not.toContain("fire-facility-completion-inspection");
    expect(targetProcedureIds).not.toContain("national-heritage-impact-diagnosis");
    expect(targetProcedureIds).not.toContain("industrial-complex-occupancy-contract");
    expect(targetProcedureIds).not.toContain("advanced-strategic-industry-fast-track-request");
    expect(targetProcedureIds).not.toContain("ai-data-center-one-stop-application");
    expect(
      filterFastTrackTargetProcedureIds(
        "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
        [
          "air-emission-installation-permit",
          "industrial-complex-occupancy-contract",
          "advanced-strategic-industry-fast-track-request",
          "ai-data-center-one-stop-application",
          "not-a-catalog-procedure",
          "air-emission-installation-permit",
        ],
        catalog.procedures,
      ),
    ).toEqual(["air-emission-installation-permit"]);

    const semiconductorTargetProcedureIds = getFastTrackTargetProcedureIds(
      "SEMICONDUCTOR_CLUSTER_FAST_TRACK",
      catalog.procedures,
    );
    expect(semiconductorTargetProcedureIds).toContain(
      "national-heritage-impact-diagnosis",
    );
    expect(semiconductorTargetProcedureIds).toContain(
      "energy-use-plan-consultation",
    );
    expect(semiconductorTargetProcedureIds).toContain(
      "public-water-implementation-plan-approval-report",
    );
    expect(semiconductorTargetProcedureIds).not.toContain("landscape-review");
    expect(semiconductorTargetProcedureIds).not.toContain(
      "building-use-approval",
    );
    expect(semiconductorTargetProcedureIds).not.toContain(
      "road-connection-permit",
    );

    for (const prefix of fastTrackPrefixes) {
      const lawId = prefix === "advanced-strategic-industry-fast-track"
        ? "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK"
        : "SEMICONDUCTOR_CLUSTER_FAST_TRACK";
      for (const procedureId of getFastTrackTargetProcedureIds(lawId, catalog.procedures)) {
        const ruleId = `rule-${prefix}-tracks-${procedureId}`;
        expect(
          catalog.rules.some((rule) => rule.id === ruleId),
          ruleId,
        ).toBe(true);
        expect(
          catalog.edges.some(
            (edge) =>
              edge.id === `edge-${prefix}-request-to-${procedureId}` &&
              edge.conditionRuleId === ruleId,
          ),
          `${prefix}:${procedureId}`,
        ).toBe(true);
      }
    }
  });

  it("keeps each plan-deeming whitelist aligned to the exact statutory provisions", () => {
    expect(industrialComplexPlanDeemedProcedureIds).toEqual(
      expect.arrayContaining([
        "public-water-implementation-plan-approval-report",
        "energy-use-plan-consultation",
      ]),
    );
    expect(industrialComplexPlanDeemedProcedureIds).not.toContain(
      "road-connection-permit",
    );
    expect(regionalSpecialZoneDeemedProcedureIds).toContain(
      "public-water-implementation-plan-approval-report",
    );
    expect(regionalSpecialZoneDeemedProcedureIds).not.toContain(
      "energy-use-plan-consultation",
    );
    expect(regionalSpecialZoneDeemedProcedureIds).not.toContain(
      "road-connection-permit",
    );
  });

  it("applies the enforcement-decree additions only to the advanced-industry request list", () => {
    const advanced = evaluateProject(
      answers({
        advancedStrategicIndustryFastTrackPermitIds: [
          "landscape-review",
          "building-use-approval",
        ],
        landscapeReviewRequired: true,
        buildingAction: "NEW_BUILD",
      }),
    );

    for (const procedureId of ["landscape-review", "building-use-approval"]) {
      expect(decision(advanced, procedureId).specialLawImpacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            lawId: "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
            effect: "FAST_TRACK",
            citationIds: expect.arrayContaining([
              "cit-advanced-strategic-industry-decree-30",
            ]),
          }),
        ]),
      );
    }

    const semiconductor = evaluateProject(
      answers({
        industryCategory: "SEMICONDUCTOR_ELECTRONICS",
        advancedStrategicIndustryFastTrackConfirmed: false,
        advancedStrategicIndustryFastTrackPermitIds: [],
        semiconductorClusterFastTrackConfirmed: true,
        semiconductorClusterApplicantRoleConfirmed: true,
        semiconductorClusterDelayRiskConfirmed: true,
        semiconductorClusterCommitteeResolved: true,
        semiconductorClusterMinisterRequestDate: "2026-08-15",
        semiconductorClusterFastTrackPermitIds: ["landscape-review"],
        landscapeReviewRequired: true,
      }),
    );

    expect(
      semiconductor.input.strategicIndustrySpecialCase.value,
    ).not.toContain("SEMICONDUCTOR_CLUSTER_FAST_TRACK:landscape-review");
    expect(
      decision(semiconductor, "landscape-review").specialLawImpacts ?? [],
    ).toEqual([]);
    expect(
      semiconductor.specialLawEvaluations.find(
        (item) => item.id === "SEMICONDUCTOR_CLUSTER_FAST_TRACK",
      ),
    ).toMatchObject({ status: "UNCONFIRMED" });
  });

  it("applies a target outside the former static list only with law and request-list evidence", () => {
    const active = evaluateProject(answers({}));

    expect(
      decision(active, "advanced-strategic-industry-fast-track-request")
        .matchedRuleIds,
    ).toContain(
      "rule-advanced-strategic-industry-fast-track-tracks-air-emission-installation-permit",
    );
    expect(
      decision(active, "air-emission-installation-permit").specialLawImpacts,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lawId: "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
          effect: "FAST_TRACK",
        }),
      ]),
    );
    expect(
      decision(active, "building-permit").specialLawImpacts ?? [],
    ).toEqual([]);

    const qualificationWithoutRequestList = evaluateProject(
      answers({
        advancedStrategicIndustryFastTrackPermitIds: [],
      }),
    );
    expect(
      decision(
        qualificationWithoutRequestList,
        "advanced-strategic-industry-fast-track-request",
      ).matchedRuleIds,
    ).not.toContain("rule-advanced-strategic-industry-fast-track-request");
    expect(
      decision(
        qualificationWithoutRequestList,
        "air-emission-installation-permit",
      ).specialLawImpacts ?? [],
    ).toEqual([]);

    const requestListWithoutQualification = evaluateProject(
      answers({
        advancedStrategicIndustryFastTrackConfirmed: false,
      }),
    );
    expect(
      decision(
        requestListWithoutQualification,
        "advanced-strategic-industry-fast-track-request",
      ).matchedRuleIds,
    ).not.toContain(
      "rule-advanced-strategic-industry-fast-track-tracks-air-emission-installation-permit",
    );
    expect(
      decision(
        requestListWithoutQualification,
        "air-emission-installation-permit",
      ).specialLawImpacts ?? [],
    ).toEqual([]);
  });

  it("drops injected contract, special-law control and unknown target IDs", () => {
    const evaluation = evaluateProject(
      answers({
        advancedStrategicIndustryFastTrackPermitIds: [
          "air-emission-installation-permit",
          "industrial-complex-occupancy-contract",
          "advanced-strategic-industry-fast-track-request",
          "ai-data-center-one-stop-application",
          "not-a-catalog-procedure",
        ],
      }),
    );
    const tokens = evaluation.input.strategicIndustrySpecialCase.value;
    expect(Array.isArray(tokens)).toBe(true);
    const tokenList = Array.isArray(tokens) ? tokens : [];

    expect(tokenList).toEqual(
      expect.arrayContaining([
        "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
        "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:air-emission-installation-permit",
      ]),
    );
    for (const token of [
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:industrial-complex-occupancy-contract",
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:advanced-strategic-industry-fast-track-request",
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:ai-data-center-one-stop-application",
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:not-a-catalog-procedure",
    ]) expect(tokenList).not.toContain(token);
    expect(
      decision(evaluation, "industrial-complex-occupancy-contract")
        .specialLawImpacts ?? [],
    ).toEqual([]);
    expect(
      decision(evaluation, "advanced-strategic-industry-fast-track-request")
        .specialLawImpacts ?? [],
    ).toEqual([]);

    const invalidOnly = evaluateProject(
      answers({
        advancedStrategicIndustryFastTrackPermitIds: [
          "industrial-complex-occupancy-contract",
          "advanced-strategic-industry-fast-track-request",
          "not-a-catalog-procedure",
        ],
      }),
    );
    expect(invalidOnly.input.strategicIndustrySpecialCase.value).not.toContain(
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
    );
    expect(
      invalidOnly.specialLawEvaluations.find(
        (item) => item.id === "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
      ),
    ).toMatchObject({ status: "UNCONFIRMED" });
  });

  it("does not activate catalog-outside or forged target IDs restored from a share URL", () => {
    const injected: ScenarioAnswers = {
      ...answers({}),
      advancedStrategicIndustryFastTrackPermitIds: [
        "air-emission-installation-permit",
        "fire-facility-completion-inspection",
        "__forged-permit-id__",
      ],
    };
    const restored = decodeShareState(
      encodeShareState(injected, "LEGAL"),
      catalog.scenarios[0].answers,
    );
    const evaluation = evaluateProject(restored.answers);
    const tokens = evaluation.input.strategicIndustrySpecialCase.value;

    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens).toContain(
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:air-emission-installation-permit",
    );
    expect(tokens).not.toContain(
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:fire-facility-completion-inspection",
    );
    expect(tokens).not.toContain(
      "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:__forged-permit-id__",
    );
    expect(
      decision(evaluation, "fire-facility-completion-inspection")
        .specialLawImpacts ?? [],
    ).toEqual([]);
  });
});
