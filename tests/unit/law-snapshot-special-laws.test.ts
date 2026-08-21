import { describe, expect, it } from "vitest";

import { getSnapshotResult } from "@/lib/law-api/snapshot";

describe("special-law fallback snapshot", () => {
  it.each([
    ["인공지능 데이터센터 산업 진흥에 관한 특별법", "src-aidc-special-act-20270310"],
    ["국가첨단전략산업 경쟁력 강화 및 보호에 관한 특별조치법", "src-advanced-strategic-industry-act-20260602"],
    ["국가첨단전략산업 경쟁력 강화 및 보호에 관한 특별조치법 시행령", "src-advanced-strategic-industry-decree-20260201"],
    ["반도체산업 경쟁력 강화 및 지원에 관한 특별법", "src-semiconductor-special-act-20260811"],
    ["산업단지 인·허가 절차 간소화를 위한 특례법", "src-industrial-complex-fast-track-act-20251001"],
    ["산업입지 및 개발에 관한 법률", "src-industrial-location-act-20260102"],
    ["규제자유특구 및 지역특화발전특구에 관한 규제특례법", "src-regional-special-zone-act-20260701"],
    ["분산에너지 활성화 특별법", "src-distributed-energy-act-20260603"],
    ["경관법", "src-landscape-act-20251001"],
  ])("includes %s when the live law API is unavailable", (query, sourceId) => {
    const result = getSnapshotResult(query);
    expect(result.mode).toBe("SNAPSHOT");
    expect(result.documents.some((document) => document.sourceId === sourceId)).toBe(true);
  });
});
