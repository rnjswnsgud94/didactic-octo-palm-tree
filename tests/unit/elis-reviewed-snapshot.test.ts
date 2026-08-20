import { describe, expect, it } from "vitest";

import generatedSnapshot from "@/lib/regions/elis-reviewed-snapshot.generated.json";
import { isElisOrdinanceDetailUrl } from "@/lib/regions/local-ordinances";
import { matchOrdinancesToCategories } from "@/lib/regions/ordinance-resolution";
import {
  getReviewedElisOrdinanceRecords,
  reviewedElisSnapshotCheckedAt,
  reviewedElisSnapshotCoveredJurisdictionCount,
  reviewedElisSnapshotJurisdictionCount,
} from "@/lib/regions/elis-reviewed-snapshot";

describe("reviewed ELIS client fallback", () => {
  it("contains only validated current-detail URLs with one current record per title", () => {
    const identities = generatedSnapshot.records.map((record) =>
      [record.provinceName, record.level, record.jurisdictionName, record.name]
        .join("|")
        .normalize("NFKC")
        .replace(/\s/g, ""),
    );

    expect(generatedSnapshot.records.length).toBeGreaterThan(1_600);
    expect(new Set(identities).size).toBe(identities.length);
    expect(
      generatedSnapshot.records.every((record) =>
        isElisOrdinanceDetailUrl(record.url),
      ),
    ).toBe(true);
    expect(
      generatedSnapshot.records.some((record) =>
        /(?:일부|전부)개정조례|폐지조례/.test(record.name.replace(/\s/g, "")),
      ),
    ).toBe(false);
  });

  it("provides exact reviewed Muju detail links and categorizes them", () => {
    const records = getReviewedElisOrdinanceRecords(
      "전북특별자치도",
      "무주군",
      "MUNICIPALITY",
    );
    const categories = new Map(
      matchOrdinancesToCategories(records).map((item) => [
        item.categoryId,
        item.ordinances,
      ]),
    );

    expect(Date.parse(reviewedElisSnapshotCheckedAt)).not.toBeNaN();
    expect(reviewedElisSnapshotJurisdictionCount).toBe(173);
    expect(reviewedElisSnapshotCoveredJurisdictionCount).toBe(172);
    expect(categories.get("sewerage-wastewater-cost")).toContainEqual(
      expect.objectContaining({
        name: "무주군 하수도 사용 조례",
        url:
          "https://www.elis.go.kr/alrpop/alrDtlsPop?alrNo=52730129348001&histNo=006",
      }),
    );
    expect(records.every((record) => record.url.includes("/alrpop/alrDtlsPop"))).toBe(true);
    expect(records.every((record) => !record.url.includes("/locgovAlrPopup"))).toBe(true);
  });

  it("keeps each municipality's snapshot isolated", () => {
    const records = getReviewedElisOrdinanceRecords(
      "전북특별자치도",
      "전주시",
      "MUNICIPALITY",
    );
    expect(records.length).toBeGreaterThan(0);
    expect(records.some((record) => record.name.startsWith("무주군"))).toBe(false);
  });

  it("covers the observed Daejeon Jung-gu production failure with exact links", () => {
    const province = getReviewedElisOrdinanceRecords(
      "대전광역시",
      "대전광역시",
      "PROVINCE",
    );
    const municipality = getReviewedElisOrdinanceRecords(
      "대전광역시",
      "중구",
      "MUNICIPALITY",
    );

    expect(province).toContainEqual(
      expect.objectContaining({
        name: "대전광역시 도시계획 조례",
        url:
          "https://www.elis.go.kr/alrpop/alrDtlsPop?alrNo=30000011001051&histNo=047",
      }),
    );
    expect(municipality).toContainEqual(
      expect.objectContaining({
        name: "대전광역시 중구 도시계획 조례",
        url:
          "https://www.elis.go.kr/alrpop/alrDtlsPop?alrNo=30140113255015&histNo=008",
      }),
    );
  });
});
