import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";

describe("catalog integrity", () => {
  it("loads a cross-referenced acyclic catalog", () => {
    expect(catalog.procedures.length).toBeGreaterThanOrEqual(90);
    expect(catalog.rules.length).toBeGreaterThanOrEqual(catalog.procedures.length);
    expect(new Set(catalog.procedures.map((item) => item.id)).size).toBe(catalog.procedures.length);
    const procedureIds = new Set(catalog.procedures.map((item) => item.id));
    for (const edge of catalog.edges) {
      expect(procedureIds.has(edge.from), `${edge.id} from`).toBe(true);
      expect(procedureIds.has(edge.to), `${edge.id} to`).toBe(true);
    }
  });

  it("covers nationwide non-capital factory investment domains", () => {
    const ids = new Set(catalog.procedures.map((item) => item.id));
    for (const id of [
      "development-activity-permit",
      "farmland-conversion-permit",
      "environmental-impact-assessment",
      "integrated-environmental-permit",
      "hazardous-chemical-business-permit",
      "hazardous-materials-facility-installation-permit",
      "high-pressure-gas-manufacture-storage-permit-report",
      "electrical-pre-use-inspection",
      "fire-facility-completion-inspection",
      "disaster-impact-assessment-consultation",
      "underground-safety-assessment",
      "national-heritage-impact-diagnosis",
      "national-heritage-simplified-diagnosis",
      "construction-safety-management-plan-approval",
      "building-demolition-start-report",
      "building-demolition-completion-report",
      "development-activity-completion-inspection",
      "public-sewer-drainage-facility-completion-inspection",
      "private-sewage-treatment-completion-inspection",
      "waste-treatment-facility-inspection",
      "chemical-registration-notification",
      "hazardous-chemical-manager-appointment-report",
      "fire-safety-manager-appointment-report",
      "hazardous-materials-tank-safety-performance-inspection",
      "electrical-safety-manager-appointment-report",
      "heat-use-equipment-installation-inspection",
      "workplace-safety-manager-appointment",
      "small-factory-registration",
      "lpg-specific-use-facility-completion-inspection",
      "city-gas-specific-use-facility-completion-inspection",
      "public-water-implementation-plan-approval-report",
      "public-water-completion-inspection-report",
      "mechanical-equipment-start-confirmation",
      "mechanical-equipment-pre-use-inspection",
      "middle-water-installation-report",
      "high-pressure-gas-business-start-report",
      "fire-work-supervisor-designation-report",
      "fire-facility-first-self-inspection-report",
      "forestland-restoration-design-approval",
      "forestland-restoration-completion-inspection",
    ]) expect(ids.has(id), id).toBe(true);
    for (const id of [
      "utility-supply-consultation",
      "asbestos-survey",
      "air-environmental-technician-appointment",
      "water-environmental-technician-appointment",
      "local-investment-agreement",
      "local-investment-subsidy-application-review",
      "local-investment-subsidy-grant-payment",
      "local-investment-subsidy-settlement",
      "industrial-complex-occupancy-contract",
      "construction-quality-management-plan-approval",
      "construction-quality-test-plan",
    ]) expect(ids.has(id), id).toBe(false);
    expect(catalog.coverage.supported.regions.join(" ")).toContain("전국 비수도권 13개 광역자치단체");
  });

  it("registers integrated-permit exclusions on base air and water procedures", () => {
    expect(catalog.procedures.find((item) => item.id === "air-emission-installation-permit")?.ruleIds).toContain("rule-exp-air-integrated-exclusion");
    expect(catalog.procedures.find((item) => item.id === "water-discharge-installation-permit")?.ruleIds).toContain("rule-exp-water-integrated-exclusion");
  });

  it("links every procedure to direct citations and a duration record", () => {
    const durationIds = new Set(catalog.durations.map((item) => item.id));
    for (const procedure of catalog.procedures) {
      if (procedure.citationIds.length === 0) {
        expect(procedure.verificationStatus, procedure.id).toBe("TODO_LEGAL_REVIEW");
        expect(procedure.reviewNote, procedure.id).toContain("법정 인허가가 아닌");
      }
      expect(procedure.durationId, procedure.id).not.toBeNull();
      expect(durationIds.has(procedure.durationId!), procedure.id).toBe(true);
    }
  });

  it("uses HTTPS official links and keeps leading-zero identifiers as strings", () => {
    for (const source of catalog.legalSources) {
      expect(source.officialUrl.startsWith("https://")).toBe(true);
      if (source.lawId !== null) expect(typeof source.lawId).toBe("string");
      if (source.mst !== null) expect(typeof source.mst).toBe("string");
    }
  });

  it("does not invent numeric durations when evidence is insufficient", () => {
    for (const duration of catalog.durations.filter((item) => item.evidenceType === "INSUFFICIENT_DATA")) {
      expect(duration.elapsed).toBeNull();
      expect(duration.authorityProcessing).toBeNull();
    }
  });

  it("keeps the expanded construction and operation paths ordered and auditable", () => {
    const edges = new Map(catalog.edges.map((item) => [item.id, item]));
    expect(edges.get("edge-exp-building-to-safety-plan")?.to).toBe("construction-safety-management-plan-approval");
    expect(edges.get("edge-exp-safety-plan-to-start")?.to).toBe("construction-start-report");
    expect(edges.get("edge-exp-fire-work-to-construction-manager")?.relation).toBe("START_TO_START");
    expect(edges.get("edge-exp-tank-inspection-to-hazardous-completion")?.to).toBe("hazardous-materials-facility-completion-inspection");
    expect(edges.get("edge-exp-demolition-start-to-completion")?.to).toBe("building-demolition-completion-report");
    expect(edges.get("edge-exp-public-water-to-implementation-plan")?.to).toBe("public-water-implementation-plan-approval-report");
    expect(edges.get("edge-exp-fire-supervisor-to-start")?.to).toBe("fire-facility-work-start-report");
    expect(edges.get("edge-exp-gas-inspection-to-business-start")?.to).toBe("high-pressure-gas-business-start-report");
    expect(edges.get("edge-exp-restoration-design-to-completion-inspection")?.to).toBe("forestland-restoration-completion-inspection");
    expect(edges.get("edge-exp-use-to-first-fire-self-inspection")?.from).toBe("building-use-approval");
    expect(edges.get("edge-exp-middle-water-to-building")?.to).toBe("building-permit");
    expect(edges.get("edge-exp-middle-water-to-building")?.strength).toBe("LEGAL_HARD");
    expect(edges.has("edge-exp-start-to-middle-water-report")).toBe(false);
  });

  it("labels Government24 periods as official processing periods, not statutory minima", () => {
    for (const id of [
      "high-pressure-gas-business-start-report",
      "fire-work-supervisor-designation-report",
      "forestland-restoration-design-approval",
      "forestland-restoration-completion-inspection",
    ]) {
      const duration = catalog.durations.find((item) => item.procedureId === id);
      expect(duration?.evidenceType, id).toBe("OFFICIAL_SERVICE_STANDARD");
      expect(duration?.statutoryPeriod, id).toContain("법정 최소기간 아님");
      expect(duration?.assumptions.join(" "), id).toContain("법정 최소기간");
    }

    const middleWater = catalog.durations.find(
      (item) => item.procedureId === "middle-water-installation-report",
    );
    expect(middleWater?.evidenceType).toBe("STATUTE");
    expect(middleWater?.authorityProcessing?.unit).toBe("CALENDAR_DAY");
    expect(middleWater?.statutoryPeriod).toContain("제9조제4항");
    expect(middleWater?.statutoryPeriod).toContain("10일 이내");
    expect(middleWater?.assumptions.join(" ")).toContain("최소기간");

    const middleWaterProcedure = catalog.procedures.find(
      (item) => item.id === "middle-water-installation-report",
    );
    expect(middleWaterProcedure?.stage).toBe("PLAN_AND_OCCUPANCY");
    expect(middleWaterProcedure?.description).toContain("건축허가 신청 또는 건축신고 전에");

    const firstFireInspection = catalog.durations.find(
      (item) => item.procedureId === "fire-facility-first-self-inspection-report",
    );
    expect(firstFireInspection?.elapsed).toBeNull();
    expect(firstFireInspection?.statutoryPeriod).toContain("60일 이내");
    expect(firstFireInspection?.assumptions.join(" ")).toContain("행정기관 처리기간이 아님");
  });

  it("does not connect a later project stage back to an earlier stage", () => {
    const stageRank = {
      SITE_REVIEW: 0,
      PLAN_AND_OCCUPANCY: 1,
      PRE_CONSTRUCTION: 2,
      DURING_CONSTRUCTION: 3,
      PRE_OPERATION: 4,
      POST_OPERATION: 5,
    } as const;
    const procedures = new Map(catalog.procedures.map((item) => [item.id, item]));
    for (const edge of catalog.edges) {
      const from = procedures.get(edge.from)!;
      const to = procedures.get(edge.to)!;
      expect(
        stageRank[from.stage],
        `${edge.id}: ${from.name}(${from.stage}) → ${to.name}(${to.stage})`,
      ).toBeLessThanOrEqual(stageRank[to.stage]);
    }
  });
});
