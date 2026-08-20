import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";
import { decodeShareState, encodeShareState } from "@/lib/share-state";

describe("versioned share state", () => {
  it("round-trips the whitelisted non-sensitive fields deterministically", () => {
    const answers = catalog.scenarios[2].answers;
    const first = encodeShareState(answers, "SCHEDULE");
    const second = encodeShareState(answers, "SCHEDULE");
    expect(first).toBe(second);
    expect(first).toContain("v=2");
    expect(decodeShareState(first, catalog.scenarios[0].answers)).toEqual({ answers, tab: "SCHEDULE" });
    expect(first).not.toContain("address");
  });

  it("migrates legacy links with newly added facts left unknown", () => {
    const fallback = catalog.scenarios[0].answers;
    const params = new URLSearchParams(encodeShareState(catalog.scenarios[2].answers, "SWIMLANE"));
    params.set("v", "1");
    for (const key of ["land", "demo", "road", "tia", "eia", "iep", "cmi", "hcb", "haz", "hpg", "shg", "fire", "pef", "eup", "gw"]) {
      params.delete(key);
    }

    const restored = decodeShareState(params.toString(), fallback);
    expect(restored.answers.integratedEnvironmentalPermitTarget).toBeNull();
    expect(restored.answers.privateElectricalFacilityWork).toBeNull();
    expect(restored.warning).toContain("신규 조건은 미확인");
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

  it("ignores unknown parameters and rejects oversized state", () => {
    const fallback = catalog.scenarios[0].answers;
    const encoded = `${encodeShareState(fallback, "SWIMLANE")}&unexpected=%3Cscript%3E`;
    expect(decodeShareState(encoded, fallback).answers).toEqual(fallback);
    expect(decodeShareState(`v=1&x=${"a".repeat(4_000)}`, fallback).warning).toContain("너무 길어");
  });

  it("preserves the validation scenario behind adjusted inputs", () => {
    const answers = {
      ...catalog.scenarios[2].answers,
      investmentType: "EXPANSION",
    };
    const encoded = encodeShareState(
      answers,
      "SWIMLANE",
      "battery-offsite-chemical",
    );

    expect(decodeShareState(encoded, catalog.scenarios[0].answers)).toEqual({
      answers,
      tab: "SWIMLANE",
      scenarioId: "battery-offsite-chemical",
    });
  });
});
