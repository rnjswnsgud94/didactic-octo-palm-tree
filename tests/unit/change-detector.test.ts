import { describe, expect, it } from "vitest";

import { catalog } from "@/lib/data/catalog";
import { detectLawChanges } from "@/lib/law-api/change-detector";
import type { NormalizedLawDocument } from "@/lib/law-api/types";

describe("law change detector", () => {
  it("returns an impact list without mutating legal rules", () => {
    const sourceId = catalog.citations[0].sourceId;
    const previous: NormalizedLawDocument[] = [{ target: "eflaw", id: "1", mst: "1", title: "산업집적법", promulgationDate: null, proclamationNumber: "old", effectiveDate: "20260701", publicUrl: "https://www.law.go.kr/법령/산업집적법", sourceId, contentHash: "before" }];
    const current = [{ ...previous[0], contentHash: "after" }];
    const beforeRules = JSON.stringify(catalog.rules);
    const impact = detectLawChanges(previous, current, [...catalog.citations], [...catalog.rules]);
    expect(impact.changedSourceIds).toEqual([sourceId]);
    expect(impact.impactedCitationIds.length).toBeGreaterThan(0);
    expect(impact.impactedRuleIds.length).toBeGreaterThan(0);
    expect(impact.checklist.join(" ")).toContain("자동 수정하지 않습니다");
    expect(JSON.stringify(catalog.rules)).toBe(beforeRules);
  });
});
