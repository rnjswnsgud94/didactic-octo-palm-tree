import { describe, expect, it } from "vitest";

import type { NormalizedLawDocument } from "@/lib/law-api/types";
import {
  matchOrdinancesToCategories,
  resolveOfficialOrdinanceRecords,
} from "@/lib/regions/ordinance-resolution";

function ordinance(
  title: string,
  jurisdictionName: string | null = "충청남도 아산시",
): NormalizedLawDocument {
  return {
    target: "ordin",
    id: null,
    mst: null,
    title,
    promulgationDate: "20260818",
    proclamationNumber: null,
    effectiveDate: null,
    jurisdictionName,
    publicUrl: `https://www.law.go.kr/${encodeURIComponent("자치법규")}/${encodeURIComponent(title.replace(/\s+/g, ""))}`,
  };
}

describe("official local-ordinance resolver", () => {
  it("keeps only the selected jurisdiction and exposes a credential-free title URL", () => {
    const records = resolveOfficialOrdinanceRecords(
      [
        ordinance("아산시 도시계획 조례"),
        ordinance("천안시 도시계획 조례", "충청남도 천안시"),
      ],
      { name: "아산시", provinceName: "충청남도", level: "MUNICIPALITY" },
    );

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      name: "아산시 도시계획 조례",
      jurisdictionName: "아산시",
      amendmentDate: "2026-08-18",
    });
    expect(records[0].url).toContain("law.go.kr");
    expect(decodeURIComponent(records[0].url)).toContain("아산시도시계획조례");
    expect(records[0].url).not.toContain("OC=");
  });

  it("does not guess among same-named districts when agency metadata is absent", () => {
    const records = resolveOfficialOrdinanceRecords(
      [ordinance("중구 도시계획 조례", null)],
      { name: "중구", provinceName: "부산광역시", level: "MUNICIPALITY" },
    );
    expect(records).toEqual([]);
  });

  it("does not misclassify a municipality returned by a province-name search", () => {
    const records = resolveOfficialOrdinanceRecords(
      [
        ordinance("아산시 도시계획 조례"),
        ordinance("충청남도 도시계획 조례", "충청남도"),
      ],
      { name: "충청남도", provinceName: "충청남도", level: "PROVINCE" },
    );

    expect(records.map((record) => record.name)).toEqual([
      "충청남도 도시계획 조례",
    ]);
  });

  it("matches actual ordinance titles to only their relevant review categories", () => {
    const records = resolveOfficialOrdinanceRecords(
      [
        ordinance("아산시 도시계획 조례"),
        ordinance("아산시 건축 조례"),
        ordinance("아산시 소셜미디어 관리 및 운영에 관한 조례"),
      ],
      { name: "아산시", provinceName: "충청남도", level: "MUNICIPALITY" },
    );
    const matches = new Map(
      matchOrdinancesToCategories(records).map((item) => [
        item.categoryId,
        item.ordinances.map((item) => item.name),
      ]),
    );

    expect(matches.get("urban-planning-development")).toEqual([
      "아산시 도시계획 조례",
    ]);
    expect(matches.get("building-review-design")).toEqual([
      "아산시 건축 조례",
    ]);
    expect([...matches.values()].flat()).not.toContain(
      "아산시 소셜미디어 관리 및 운영에 관한 조례",
    );
  });

  it("matches separately titled sewerage originator-charge ordinances", () => {
    const matches = new Map(
      matchOrdinancesToCategories([
        {
          name: "가상군 하수도 원인자부담금 산정·징수 조례",
          level: "MUNICIPALITY",
          jurisdictionName: "가상군",
          amendmentDate: "2026-08-21",
          url: "https://www.elis.go.kr/alrpop/alrDtlsPop?alrNo=52730111111111&histNo=001",
        },
      ]).map((item) => [item.categoryId, item.ordinances]),
    );

    expect(matches.get("sewerage-wastewater-cost")).toContainEqual(
      expect.objectContaining({
        name: "가상군 하수도 원인자부담금 산정·징수 조례",
      }),
    );
  });
});
