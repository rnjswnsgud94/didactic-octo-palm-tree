import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";

describe("catalog integrity", () => {
  it("loads a cross-referenced acyclic catalog", () => {
    expect(catalog.procedures.length).toBeGreaterThanOrEqual(50);
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
    ]) expect(ids.has(id), id).toBe(true);
    expect(catalog.coverage.supported.regions.join(" ")).toContain("전국 비수도권 14개 시·도");
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
});
