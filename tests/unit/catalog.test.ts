import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";

describe("catalog integrity", () => {
  it("loads a cross-referenced acyclic catalog", () => {
    expect(catalog.procedures.length).toBeGreaterThanOrEqual(10);
    expect(catalog.rules.length).toBeGreaterThanOrEqual(catalog.procedures.length);
    expect(new Set(catalog.procedures.map((item) => item.id)).size).toBe(catalog.procedures.length);
    const procedureIds = new Set(catalog.procedures.map((item) => item.id));
    for (const edge of catalog.edges) {
      expect(procedureIds.has(edge.from), `${edge.id} from`).toBe(true);
      expect(procedureIds.has(edge.to), `${edge.id} to`).toBe(true);
    }
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
