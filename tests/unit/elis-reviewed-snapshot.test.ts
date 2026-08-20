import { describe, expect, it } from "vitest";

import { matchOrdinancesToCategories } from "@/lib/regions/ordinance-resolution";
import {
  getReviewedElisOrdinanceRecords,
  reviewedElisSnapshotCheckedAt,
} from "@/lib/regions/elis-reviewed-snapshot";

describe("reviewed ELIS client fallback", () => {
  it("provides only exact reviewed Muju detail links and categorizes them", () => {
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

    expect(reviewedElisSnapshotCheckedAt).toBe("2026-08-21T00:00:00.000Z");
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

  it("does not reuse Muju records for another municipality", () => {
    expect(
      getReviewedElisOrdinanceRecords(
        "전북특별자치도",
        "전주시",
        "MUNICIPALITY",
      ),
    ).toEqual([]);
  });
});
