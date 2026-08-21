import { describe, expect, it } from "vitest";

import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import { evaluateProject } from "@/lib/engine/pipeline";

function answers(overrides: Partial<ScenarioAnswers>): ScenarioAnswers {
  return {
    ...catalog.scenarios[0].answers,
    province: "충청남도",
    city: "아산시",
    insideIndustrialComplex: false,
    industryCategory: "AI_DATA_CENTER",
    investmentType: "NEW",
    buildingAction: "NEW_BUILD",
    totalAreaM2: 30_000,
    gridImpactAssessmentRequired: true,
    aiDataCenterActFacilityConfirmed: true,
    aiDataCenterOneStopStatus: "NOT_APPLIED",
    appliedSpecialLawIds: [],
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

describe("AI data-center special-law routing", () => {
  it("keeps the grid assessment before the Act takes effect", () => {
    const evaluation = evaluateProject(
      answers({
        assessmentDate: "2026-08-21",
        appliedSpecialLawIds: ["AIDC_GRID_IMPACT_EXEMPTION"],
      }),
    );

    expect(decision(evaluation, "power-grid-impact-assessment").provisionalEffect).toBe("INCLUDE");
    expect(evaluation.specialLawEvaluations[0]).toMatchObject({
      id: "AIDC_GRID_IMPACT_EXEMPTION",
      status: "FUTURE",
    });
    expect(decision(evaluation, "power-grid-impact-assessment").specialLawImpacts?.[0].status).toBe("FUTURE");
  });

  it("exempts only the grid assessment after confirmed post-effective selection", () => {
    const evaluation = evaluateProject(
      answers({
        assessmentDate: "2027-03-10",
        appliedSpecialLawIds: ["AIDC_GRID_IMPACT_EXEMPTION"],
      }),
    );

    expect(decision(evaluation, "power-grid-impact-assessment")).toMatchObject({
      status: "DOES_NOT_APPLY",
      provisionalEffect: "EXCLUDE",
    });
    expect(evaluation.specialLawEvaluations[0].status).toBe("ACTIVE");
    expect(decision(evaluation, "building-permit").provisionalEffect).not.toBe("EXCLUDE");
  });

  it.each([null, false] as const)(
    "does not apply a selected exemption when facility qualification is %s",
    (aiDataCenterActFacilityConfirmed) => {
      const evaluation = evaluateProject(
        answers({
          assessmentDate: "2027-03-10",
          aiDataCenterActFacilityConfirmed,
          appliedSpecialLawIds: ["AIDC_GRID_IMPACT_EXEMPTION"],
        }),
      );

      expect(decision(evaluation, "power-grid-impact-assessment").provisionalEffect).toBe("INCLUDE");
      expect(evaluation.specialLawEvaluations[0].status).toBe(
        aiDataCenterActFacilityConfirmed === null ? "UNCONFIRMED" : "MISMATCH",
      );
    },
  );

  it("keeps the report while one-stop treatment is planned and routes affected permits after the application", () => {
    const evaluation = evaluateProject(
      answers({
        assessmentDate: "2027-04-01",
        energyUsePlanRequired: true,
        trafficImpactAssessmentRequired: true,
        landscapeReviewRequired: true,
        buildingCommitteeReviewRequired: true,
        fireFacilityWork: true,
        aiDataCenterOneStopStatus: "PLANNED",
        appliedSpecialLawIds: ["AIDC_ONE_STOP"],
      }),
    );

    expect(decision(evaluation, "ai-data-center-business-report").provisionalEffect).toBe("INCLUDE");
    expect(decision(evaluation, "ai-data-center-business-report").isDeemed).toBe(false);
    expect(decision(evaluation, "ai-data-center-one-stop-application").provisionalEffect).toBe("INCLUDE");
    expect(decision(evaluation, "power-grid-impact-assessment").provisionalEffect).toBe("INCLUDE");
    expect(decision(evaluation, "power-grid-impact-assessment").specialLawImpacts?.[0]).toMatchObject({
      effect: "ONE_STOP",
      statutoryCap: expect.stringContaining("150일"),
      citationIds: expect.arrayContaining(["cit-aidc-special-act-18-9"]),
    });
    expect(
      decision(evaluation, "power-grid-impact-assessment").specialLawImpacts?.[0]
        .statutoryCap,
    ).toContain("거부 통지가 없으면");
    expect(decision(evaluation, "energy-use-plan-consultation").specialLawImpacts?.[0].statutoryCap).toContain("90일");
    expect(decision(evaluation, "landscape-review").specialLawImpacts?.[0].statutoryCap).toContain("90일");
    expect(decision(evaluation, "building-committee-review").specialLawImpacts?.[0].statutoryCap).toContain("90일");
    expect(decision(evaluation, "building-permit").specialLawImpacts?.[0].statutoryCap).toContain("40일");
    const order = evaluation.schedules.TYPICAL.topologicalOrder;
    expect(order.indexOf("ai-data-center-one-stop-application")).toBeLessThan(
      order.indexOf("power-grid-impact-assessment"),
    );
  });

  it("deems the report only after one-stop processing is completed", () => {
    const evaluation = evaluateProject(
      answers({
        assessmentDate: "2027-04-01",
        aiDataCenterOneStopStatus: "COMPLETED",
        appliedSpecialLawIds: ["AIDC_ONE_STOP"],
      }),
    );

    expect(decision(evaluation, "ai-data-center-one-stop-result").provisionalEffect).toBe("INCLUDE");
    expect(decision(evaluation, "ai-data-center-business-report")).toMatchObject({
      provisionalEffect: "EXCLUDE",
      isDeemed: true,
    });
    expect(decision(evaluation, "ai-data-center-business-report").specialLawImpacts?.[0]).toMatchObject({
      effect: "DEEMED_REPORT",
    });
  });

  it("keeps the general grid-review cap separate from the selected AIDC one-stop impact", () => {
    const procedure = catalog.procedures.find(
      (item) => item.id === "power-grid-impact-assessment",
    );
    const duration = catalog.durations.find(
      (item) => item.id === "duration-power-grid-impact-assessment",
    );
    const durationCitation = catalog.citations.find(
      (item) => item.id === "cit-distributed-energy-act-24-duration",
    );

    expect(procedure).toMatchObject({
      receivingAuthority: "기후에너지환경부",
      consultationAuthorities: expect.arrayContaining(["전력정책심의회"]),
      citationIds: expect.arrayContaining([
        "cit-distributed-energy-act-24-process",
        "cit-distributed-energy-act-24-duration",
      ]),
    });
    expect(procedure?.citationIds.some((id) => id.startsWith("cit-aidc-"))).toBe(false);
    expect(procedure?.consultationAuthorities).not.toContain("전기위원회");
    expect(duration).toMatchObject({
      elapsed: { min: null, base: null, max: 3, unit: "MONTH" },
      evidenceType: "STATUTE",
      statutoryPeriod: expect.stringContaining("접수일부터 3개월 이내"),
    });
    expect(duration?.statutoryPeriod).not.toContain("150일");
    expect(duration?.citationIds.some((id) => id.startsWith("cit-aidc-"))).toBe(false);
    expect(duration?.assumptions).toContain(
      "3개월은 통상 소요기간이 아니라 일반 경로의 법정 처리상한입니다.",
    );
    expect(durationCitation).toMatchObject({
      article: "제24조",
      paragraph: "제6항",
      role: "DURATION",
    });
  });

  it("removes factory-only approval and completion paths for the AIDC service profile", () => {
    for (const assessmentDate of ["2025-01-01", "2026-08-21"]) {
      const evaluation = evaluateProject(answers({ assessmentDate }));
      for (const procedureId of [
        "factory-establishment-approval",
        "factory-completion-report-complex",
        "factory-completion-report-offsite",
        "small-factory-registration",
      ]) {
        const result = decision(evaluation, procedureId);
        expect(result.provisionalEffect, `${assessmentDate}:${procedureId}`).toBe("EXCLUDE");
        expect(result.matchedRuleIds, `${assessmentDate}:${procedureId}`).toContain(
          `rule-aidc-exclude-${procedureId}`,
        );
        expect(
          result.traces.flatMap((trace) => trace.citationIds),
          `${assessmentDate}:${procedureId}`,
        ).toContain("cit-indcluster-2-1-factory-definition");
      }
    }
  });

  it("does not use the AIDC industry profile to exclude environmental or safety permits", () => {
    const evaluation = evaluateProject(
      answers({
        assessmentDate: "2026-08-21",
        airEmissionFacility: true,
        waterDischargeFacility: true,
        integratedEnvironmentalPermitTarget: false,
        hazardousMaterials: true,
        highPressureGas: true,
      }),
    );

    for (const procedureId of [
      "air-emission-installation-permit",
      "water-discharge-installation-permit",
      "hazardous-materials-facility-installation-permit",
      "high-pressure-gas-manufacture-storage-permit-report",
    ]) {
      const result = decision(evaluation, procedureId);
      expect(result.provisionalEffect, procedureId).not.toBe("EXCLUDE");
      expect(
        result.matchedRuleIds.some((ruleId) => ruleId.startsWith("rule-aidc-exclude-")),
        procedureId,
      ).toBe(false);
    }
  });

  it("does not apply an AIDC selection to another industry", () => {
    const evaluation = evaluateProject(
      answers({
        assessmentDate: "2027-04-01",
        industryCategory: "SEMICONDUCTOR_ELECTRONICS",
        appliedSpecialLawIds: ["AIDC_GRID_IMPACT_EXEMPTION"],
      }),
    );

    expect(evaluation.specialLawEvaluations[0].status).toBe("MISMATCH");
    expect(decision(evaluation, "power-grid-impact-assessment").provisionalEffect).toBe("INCLUDE");
  });

  it("does not expose AIDC citations in a post-effective non-AIDC legal-view decision set", () => {
    const evaluation = evaluateProject(
      answers({
        assessmentDate: "2027-04-01",
        industryCategory: "SEMICONDUCTOR_ELECTRONICS",
        aiDataCenterActFacilityConfirmed: null,
        aiDataCenterOneStopStatus: "NOT_APPLIED",
        appliedSpecialLawIds: [],
        gridImpactAssessmentRequired: true,
        landscapeReviewRequired: true,
        buildingCommitteeReviewRequired: true,
      }),
    );
    const legalViewDecisions = evaluation.decisions.filter(
      (item) => item.provisionalEffect !== "EXCLUDE" || item.specialLawImpacts?.length,
    );
    const visibleCitationIds = legalViewDecisions.flatMap((item) => [
      ...item.procedure.citationIds,
      ...item.traces.flatMap((trace) => trace.citationIds),
      ...(item.specialLawImpacts ?? []).flatMap((impact) => impact.citationIds),
    ]);

    expect(visibleCitationIds.some((id) => id.startsWith("cit-aidc-"))).toBe(false);
    expect(
      decision(evaluation, "power-grid-impact-assessment").traces.map(
        (trace) => trace.ruleId,
      ),
    ).not.toContain("rule-aidc-grid-impact-exemption");
  });
});
