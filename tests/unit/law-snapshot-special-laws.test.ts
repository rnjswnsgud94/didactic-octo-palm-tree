import { describe, expect, it } from "vitest";

import { getSnapshotResult } from "@/lib/law-api/snapshot";

describe("special-law fallback snapshot", () => {
  it.each([
    ["인공지능 데이터센터 산업 진흥에 관한 특별법", "src-aidc-special-act-20270310"],
    ["분산에너지 활성화 특별법", "src-distributed-energy-act-20260603"],
    ["경관법", "src-landscape-act-20251001"],
  ])("includes %s when the live law API is unavailable", (query, sourceId) => {
    const result = getSnapshotResult(query);
    expect(result.mode).toBe("SNAPSHOT");
    expect(result.documents.some((document) => document.sourceId === sourceId)).toBe(true);
  });
});
