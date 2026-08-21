import { describe, expect, it } from "vitest";

import { catalog, scenarioAnswerSchema, type ScenarioAnswers } from "@/lib/data/catalog";
import {
  decodeShareState,
  encodeShareState,
  MAX_SHARE_STATE_LENGTH,
  ShareStateTooLongError,
} from "@/lib/share-state";

describe("versioned share state", () => {
  it("round-trips the whitelisted non-sensitive fields deterministically", () => {
    const answers = catalog.scenarios[2].answers;
    const first = encodeShareState(answers, "SCHEDULE");
    const second = encodeShareState(answers, "SCHEDULE");
    expect(first).toBe(second);
    expect(first).toContain("v=11");
    expect(decodeShareState(first, catalog.scenarios[0].answers)).toEqual({ answers, tab: "SCHEDULE" });
    expect(first).not.toContain("address");
  });

  it("preserves expanded free-text inputs beyond the former 80-character decoder limit", () => {
    const fallback = catalog.scenarios[0].answers;
    const answers: ScenarioAnswers = {
      ...fallback,
      siteAddress: `충청남도 아산시 ${"검토필지".repeat(18)}`,
      siteRestrictedFactors: "농지·산지·진입도로 검토, ".repeat(12),
      products: "메모리반도체·첨단패키징 부품, ".repeat(10),
      coreProcesses: "웨이퍼 가공·조립·검사, ".repeat(10),
      existingApprovalIds: "기존 승인문서 2026-01, ".repeat(10),
    };
    const encoded = encodeShareState(answers, "ACTION");

    expect(encoded.length).toBeLessThanOrEqual(MAX_SHARE_STATE_LENGTH);
    expect(decodeShareState(encoded, fallback)).toEqual({ answers, tab: "ACTION" });
  });

  it("round-trips a valid expanded state above the former 3,000-character limit", () => {
    const fallback = catalog.scenarios[0].answers;
    const permitIds = catalog.procedures.slice(0, 20).map((item) => item.id);
    const answers: ScenarioAnswers = {
      ...fallback,
      industrialComplexPlanIncludedPermitIds: permitIds,
      regionalSpecialZonePlanIncludedPermitIds: permitIds,
      semiconductorClusterPlanIncludedPermitIds: permitIds,
      advancedStrategicIndustryFastTrackPermitIds: permitIds,
      semiconductorClusterFastTrackPermitIds: permitIds,
    };
    const encoded = encodeShareState(answers, "LEGAL");

    expect(encoded.length).toBeGreaterThan(3_000);
    expect(encoded.length).toBeLessThanOrEqual(MAX_SHARE_STATE_LENGTH);
    expect(decodeShareState(encoded, fallback)).toEqual({ answers, tab: "LEGAL" });
    expect(decodeShareState(`?${encoded}`, fallback)).toEqual({ answers, tab: "LEGAL" });
  });

  it("migrates legacy links with newly added facts left unknown", () => {
    const fallback = catalog.scenarios[0].answers;
    const params = new URLSearchParams(encodeShareState(catalog.scenarios[2].answers, "SWIMLANE"));
    params.set("v", "1");
    for (const key of ["land", "demo", "road", "tia", "eia", "iep", "cmi", "hcb", "haz", "hpg", "shg", "fire", "pef", "eup", "gw"]) params.delete(key);

    const restored = decodeShareState(params.toString(), fallback);
    expect(restored.answers.integratedEnvironmentalPermitTarget).toBeNull();
    expect(restored.answers.privateElectricalFacilityWork).toBeNull();
    expect(restored.warning).toContain("신규 조건은 미확인");
  });

  it("round-trips AI data-center qualification, one-stop status, and selected special laws in v9", () => {
    const fallback = catalog.scenarios[0].answers;
    const answers: ScenarioAnswers = {
      ...fallback,
      industryCategory: "AI_DATA_CENTER",
      landscapeReviewRequired: true,
      buildingCommitteeReviewRequired: true,
      gridImpactAssessmentRequired: true,
      aiDataCenterActFacilityConfirmed: true,
      aiDataCenterOneStopStatus: "COMPLETED",
      appliedSpecialLawIds: ["AIDC_ONE_STOP", "AIDC_GRID_IMPACT_EXEMPTION"],
    };
    const encoded = encodeShareState(answers, "LEGAL");

    expect(decodeShareState(encoded, fallback)).toEqual({ answers, tab: "LEGAL" });
    expect(encoded).toContain("aic=1");
    expect(encoded).toContain("aos=COMPLETED");
    expect(encoded).toContain("sl=AIDC_ONE_STOP.AIDC_GRID_IMPACT_EXEMPTION");
  });

  it("round-trips automatic special-law qualification facts only in v9", () => {
    const fallback = catalog.scenarios[0].answers;
    const answers: ScenarioAnswers = {
      ...fallback,
      industryCategory: "SEMICONDUCTOR_ELECTRONICS",
      insideIndustrialComplex: true,
      advancedStrategicIndustryFastTrackConfirmed: true,
      semiconductorClusterFastTrackConfirmed: true,
      industrialComplexPlanSpecialCaseConfirmed: false,
      regionalSpecialZonePlanDeemingConfirmed: true,
    };
    const encoded = encodeShareState(answers, "LEGAL");

    expect(decodeShareState(encoded, fallback)).toEqual({ answers, tab: "LEGAL" });
    expect(encoded).toContain("asf=1");
    expect(encoded).toContain("scf=1");
    expect(encoded).toContain("icp=0");
    expect(encoded).toContain("rsz=1");

    const legacy = new URLSearchParams(encoded);
    legacy.set("v", "8");
    const restored = decodeShareState(legacy.toString(), fallback);
    expect(restored.answers.advancedStrategicIndustryFastTrackConfirmed).toBeNull();
    expect(restored.answers.semiconductorClusterFastTrackConfirmed).toBeNull();
    expect(restored.answers.industrialComplexPlanSpecialCaseConfirmed).toBeNull();
    expect(restored.answers.regionalSpecialZonePlanDeemingConfirmed).toBeNull();
    expect(restored.warning).toContain("업종·지역·산업단지 특별법 확인값");
  });

  it("round-trips plan approval and gazette evidence only in v11", () => {
    const fallback = catalog.scenarios[0].answers;
    const answers: ScenarioAnswers = {
      ...fallback,
      industrialComplexPlanSpecialCaseConfirmed: true,
      industrialComplexPlanDocumentsIncluded: true,
      industrialComplexPlanConsultationCompleted: true,
      industrialComplexPlanApprovalPublished: true,
      industrialComplexPlanApprovalPublishedDate: "2026-08-20",
      industrialComplexPlanApprovalNoticeReference: "충청남도고시 제2026-100호",
      industrialComplexPlanIncludedPermitIds: ["building-permit"],
    };
    const encoded = encodeShareState(answers, "LEGAL");

    expect(encoded).toContain("v=11");
    expect(encoded).toContain("ipa=1");
    expect(encoded).toContain("ipad=2026-08-20");
    expect(decodeShareState(encoded, fallback)).toEqual({ answers, tab: "LEGAL" });

    const legacy = new URLSearchParams(encoded);
    legacy.set("v", "10");
    const restored = decodeShareState(legacy.toString(), fallback);
    expect(restored.answers.industrialComplexPlanApprovalPublished).toBeNull();
    expect(restored.answers.industrialComplexPlanApprovalPublishedDate).toBeNull();
    expect(restored.answers.industrialComplexPlanApprovalNoticeReference).toBe("");
    expect(restored.warning).toContain("승인·고시 완료 증거");
  });

  it("ignores injected v8-only special-law fields in a legacy-version URL", () => {
    const fallback = catalog.scenarios[0].answers;
    const params = new URLSearchParams(encodeShareState(fallback, "SWIMLANE"));
    params.set("v", "7");
    params.set("aic", "1");
    params.set("aos", "COMPLETED");
    params.set("gia", "1");
    params.set("sl", "AIDC_GRID_IMPACT_EXEMPTION");

    const restored = decodeShareState(params.toString(), fallback);
    expect(restored.answers.aiDataCenterActFacilityConfirmed).toBeNull();
    expect(restored.answers.aiDataCenterOneStopStatus).toBe("NOT_APPLIED");
    expect(restored.answers.gridImpactAssessmentRequired).toBeNull();
    expect(restored.answers.appliedSpecialLawIds).toEqual([]);
    expect(restored.warning).toContain("AI 데이터센터 특례 조건");
  });

  it("falls back safely when a shared region is outside the non-capital scope", () => {
    const fallback = catalog.scenarios[0].answers;
    const params = new URLSearchParams(encodeShareState(catalog.scenarios[2].answers, "SWIMLANE"));
    params.set("pr", "경기도");
    params.set("ct", "수원시");

    const restored = decodeShareState(params.toString(), fallback);
    expect(restored.answers.province).toBe(fallback.province);
    expect(restored.answers.city).toBe(fallback.city);
    expect(restored.warning).toContain("지원 범위 밖 지역");
  });

  it("preserves an intentionally unselected province", () => {
    const fallback = catalog.scenarios[0].answers;
    const answers = { ...fallback, province: "", city: "" };
    expect(decodeShareState(encodeShareState(answers, "SWIMLANE"), fallback)).toEqual({ answers, tab: "SWIMLANE" });
  });

  it("ignores unknown parameters and rejects oversized state", () => {
    const fallback = catalog.scenarios[0].answers;
    const encoded = `${encodeShareState(fallback, "SWIMLANE")}&unexpected=%3Cscript%3E`;
    expect(decodeShareState(encoded, fallback).answers).toEqual(fallback);
    expect(decodeShareState(`v=1&x=${"a".repeat(MAX_SHARE_STATE_LENGTH)}`, fallback).warning).toContain("너무 길어");
  });

  it("refuses to create a link that the decoder would reject", () => {
    const fallback = catalog.scenarios[0].answers;
    const answers: ScenarioAnswers = {
      ...fallback,
      siteAddress: "가".repeat(200),
      siteZoning: "나".repeat(120),
      siteRestrictedFactors: "다".repeat(500),
      industrialComplexName: "라".repeat(120),
      industrialComplexManagingAuthority: "마".repeat(120),
      products: "바".repeat(500),
      coreProcesses: "사".repeat(500),
      existingApprovalIds: "아".repeat(500),
    };

    expect(() => encodeShareState(answers, "ACTION")).toThrow(ShareStateTooLongError);
  });

  it("stores daily construction dates but no user-entered planning duration", () => {
    const answers = {
      ...catalog.scenarios[2].answers,
      investmentType: "EXPANSION",
      plannedConstructionStartDate: "2028-01-15",
      plannedConstructionEndDate: "2030-06-20",
    };
    const encoded = encodeShareState(answers, "SWIMLANE");

    expect(decodeShareState(encoded, catalog.scenarios[0].answers)).toEqual({ answers, tab: "SWIMLANE" });
    expect(encoded).toContain("cs=2028-01-15");
    expect(encoded).toContain("ce=2030-06-20");
    for (const removedKey of ["ppn", "ppb", "ppx", "dpn", "dpb", "dpx", "opn", "opb", "opx", "pon", "pob", "pox"]) {
      expect(encoded).not.toContain(`${removedKey}=`);
    }
    expect(new URLSearchParams(encoded).has("sc")).toBe(false);
  });

  it("migrates v5 monthly construction values to exact month boundaries", () => {
    const fallback = catalog.scenarios[0].answers;
    const params = new URLSearchParams(encodeShareState(fallback, "SCHEDULE"));
    params.set("v", "5");
    params.set("cs", "2028-01");
    params.set("ce", "2030-06");

    const restored = decodeShareState(params.toString(), fallback);
    expect(restored.answers.plannedConstructionStartDate).toBe("2028-01-01");
    expect(restored.answers.plannedConstructionEndDate).toBe("2030-06-30");
    expect(restored.warning).toContain("월 단위 공사 일정");
  });

  it("accepts old links while ignoring retired planning assumptions", () => {
    const fallback = catalog.scenarios[0].answers;
    const params = new URLSearchParams(encodeShareState(fallback, "SCHEDULE"));
    params.set("v", "4");
    params.set("ppb", "9");
    params.set("opx", "12");

    const restored = decodeShareState(params.toString(), fallback);
    expect(restored.answers).toEqual(fallback);
    expect("preConstructionPlanningBaseMonths" in restored.answers).toBe(false);
  });

  it("rejects impossible assessment dates instead of evaluating the wrong law version", () => {
    expect(scenarioAnswerSchema.safeParse({ ...catalog.scenarios[0].answers, assessmentDate: "2028-02-29" }).success).toBe(true);
    expect(scenarioAnswerSchema.safeParse({ ...catalog.scenarios[0].answers, assessmentDate: "2027-02-29" }).success).toBe(false);

    const fallback = catalog.scenarios[0].answers;
    const params = new URLSearchParams(encodeShareState(fallback, "SWIMLANE"));
    params.set("d", "2027-02-29");
    const restored = decodeShareState(params.toString(), fallback);
    expect(restored.answers).toEqual(fallback);
    expect(restored.warning).toContain("올바르지 않아 기본값");
  });
});
