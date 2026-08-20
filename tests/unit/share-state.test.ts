import { describe, expect, it } from "vitest";

import { catalog, scenarioAnswerSchema } from "@/lib/data/catalog";
import { decodeShareState, encodeShareState } from "@/lib/share-state";

describe("versioned share state", () => {
  it("round-trips the whitelisted non-sensitive fields deterministically", () => {
    const answers = catalog.scenarios[2].answers;
    const first = encodeShareState(answers, "SCHEDULE");
    const second = encodeShareState(answers, "SCHEDULE");
    expect(first).toBe(second);
    expect(first).toContain("v=7");
    expect(decodeShareState(first, catalog.scenarios[0].answers)).toEqual({ answers, tab: "SCHEDULE" });
    expect(first).not.toContain("address");
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
    expect(decodeShareState(`v=1&x=${"a".repeat(4_000)}`, fallback).warning).toContain("너무 길어");
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
    expect(encoded).not.toContain("sc=");
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
