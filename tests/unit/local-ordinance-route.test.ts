import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OfficialOrdinanceRecord } from "@/lib/regions/ordinance-resolution";

const { fetchElisOrdinanceRecords } = vi.hoisted(() => ({
  fetchElisOrdinanceRecords: vi.fn(),
}));

vi.mock("@/lib/regions/elis-client.server", () => ({ fetchElisOrdinanceRecords }));

import { GET } from "@/app/api/local-ordinances/route";

function liveResult(records: OfficialOrdinanceRecord[]) {
  return {
    mode: "LIVE",
    checkedAt: "2026-08-21T00:00:00.000Z",
    records,
  };
}

function reviewedResult(records: OfficialOrdinanceRecord[]) {
  return {
    mode: "REVIEWED",
    checkedAt: "2026-08-20T00:00:00.000Z",
    records,
  };
}

function ordinance(
  title: string,
  jurisdictionName: string,
  level: "PROVINCE" | "MUNICIPALITY",
  alrNo: string,
): OfficialOrdinanceRecord {
  return {
    name: title,
    level,
    jurisdictionName,
    amendmentDate: "2026-08-18",
    url: `https://www.elis.go.kr/alrpop/alrDtlsPop?alrNo=${alrNo}&histNo=001`,
  };
}

describe("local ordinance API route", () => {
  beforeEach(() => fetchElisOrdinanceRecords.mockReset());

  it("returns exact province and municipality ordinance detail links without credentials", async () => {
    fetchElisOrdinanceRecords
      .mockResolvedValueOnce(
        liveResult([
          ordinance("충청남도 도시계획 조례", "충청남도", "PROVINCE", "44100111111111"),
        ]),
      )
      .mockResolvedValueOnce(
        liveResult([
          ordinance("아산시 도시계획 조례", "아산시", "MUNICIPALITY", "44200111111111"),
        ]),
      );

    const response = await GET(
      new Request(
        "http://localhost/api/local-ordinances?province=%EC%B6%A9%EC%B2%AD%EB%82%A8%EB%8F%84&city=%EC%95%84%EC%82%B0%EC%8B%9C",
      ),
    );
    const payload = await response.json();
    const categories = new Map(
      payload.categories.map(
        (item: { categoryId: string; ordinances: OfficialOrdinanceRecord[] }) => [
          item.categoryId,
          item.ordinances,
        ],
      ),
    );

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("LIVE");
    expect(fetchElisOrdinanceRecords).toHaveBeenCalledTimes(2);
    expect(categories.get("urban-planning-development")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "아산시 도시계획 조례",
          level: "MUNICIPALITY",
        }),
        expect.objectContaining({
          name: "충청남도 도시계획 조례",
          level: "PROVINCE",
        }),
      ]),
    );
    expect(JSON.stringify(payload)).not.toContain("천안시 도시계획 조례");
    expect(JSON.stringify(payload)).not.toContain("OC=");
    expect(JSON.stringify(payload)).toContain("alrDtlsPop");
  });

  it("reports partial coverage when only one jurisdiction was queried live", async () => {
    fetchElisOrdinanceRecords
      .mockResolvedValueOnce(
        liveResult([
          ordinance("충청남도 도시계획 조례", "충청남도", "PROVINCE", "44100111111111"),
        ]),
      )
      .mockRejectedValueOnce(new Error("municipality unavailable"));

    const response = await GET(
      new Request(
        "http://localhost/api/local-ordinances?province=%EC%B6%A9%EC%B2%AD%EB%82%A8%EB%8F%84&city=%EC%95%84%EC%82%B0%EC%8B%9C",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("PARTIAL");
    expect(payload.checkedAt).toBe("2026-08-21T00:00:00.000Z");
  });

  it("reports reviewed-only records as a snapshot rather than live partial coverage", async () => {
    fetchElisOrdinanceRecords
      .mockRejectedValueOnce(new Error("province unavailable"))
      .mockResolvedValueOnce(
        reviewedResult([
          ordinance("무주군 하수도 사용 조례", "무주군", "MUNICIPALITY", "52730129348001"),
        ]),
      );

    const response = await GET(
      new Request(
        "http://localhost/api/local-ordinances?province=%EC%A0%84%EB%B6%81%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84&city=%EB%AC%B4%EC%A3%BC%EA%B5%B0",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("SNAPSHOT");
    expect(payload.checkedAt).toBe("2026-08-20T00:00:00.000Z");
    expect(JSON.stringify(payload)).toContain("무주군 하수도 사용 조례");
  });

  it("returns an upstream error when no jurisdiction has live or reviewed records", async () => {
    fetchElisOrdinanceRecords.mockResolvedValue(liveResult([]));

    const response = await GET(
      new Request(
        "http://localhost/api/local-ordinances?province=%EC%B6%A9%EC%B2%AD%EB%82%A8%EB%8F%84&city=%EC%95%84%EC%82%B0%EC%8B%9C",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toContain("ELIS");
  });
});
