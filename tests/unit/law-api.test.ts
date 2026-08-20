import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { LawApiError, normalizeSearchPayload, parseLawPayload, resetLawApiMemoryStateForTests, searchLawApi } from "@/lib/law-api/client.server";

const fixtureDirectory = join(process.cwd(), "tests", "fixtures", "law-api");
const pageOne = JSON.parse(readFileSync(join(fixtureDirectory, "search-eflaw.json"), "utf8")) as unknown;
const administrativeRuleXml = readFileSync(join(fixtureDirectory, "search-admrul.xml"), "utf8");
const errorPayload = JSON.parse(readFileSync(join(fixtureDirectory, "error.json"), "utf8")) as unknown;

describe("national law API adapter", () => {
  beforeEach(() => resetLawApiMemoryStateForTests());

  it("normalizes one-item JSON without losing leading zeroes", () => {
    const result = normalizeSearchPayload("eflaw", pageOne);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].id).toBe("00123");
    expect(result.documents[0].mst).toBe("0456");
    expect(result.documents[0].publicUrl).not.toContain("OC=");
  });

  it("normalizes XML and target-specific roots", () => {
    const parsed = parseLawPayload(administrativeRuleXml, "application/xml");
    const result = normalizeSearchPayload("admrul", parsed);
    expect(result.documents[0]).toMatchObject({ id: "0009", title: "공장설립업무처리규정", target: "admrul" });
  });

  it("normalizes the current OrdinSearch.law response shape", () => {
    const result = normalizeSearchPayload("ordin", {
      OrdinSearch: {
        totalCnt: "1",
        page: "1",
        law: {
          자치법규ID: "2162613",
          자치법규일련번호: "2162613",
          자치법규명: "아산시 도시계획 조례",
          지자체기관명: "충청남도 아산시",
          공포일자: "20260818",
        },
      },
    });

    expect(result.documents[0]).toMatchObject({
      target: "ordin",
      title: "아산시 도시계획 조례",
      jurisdictionName: "충청남도 아산시",
      promulgationDate: "20260818",
    });
    expect(result.documents[0].publicUrl).toContain("law.go.kr");
    expect(result.documents[0].publicUrl).not.toContain("OC=");
  });

  it("rejects a wrong target root and HTTP-200 API error payload", () => {
    expect(() => normalizeSearchPayload("ordin", pageOne)).toThrow(LawApiError);
    expect(() => normalizeSearchPayload("law", errorPayload)).toThrowError(/인증/);
  });

  it("paginates live results and keeps the secret out of output", async () => {
    const seen: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      seen.push(url);
      const page = new URL(url).searchParams.get("page");
      const payload = page === "1" ? pageOne : { LawSearch: { totalCnt: "2", page: "2", law: { 법령ID: "00200", 법령명한글: "건축법" } } };
      return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
    };
    const result = await searchLawApi({ target: "eflaw", query: "pagination-case" }, { oc: "top-secret", fetchImpl, now: new Date("2026-08-20T00:00:00Z") });
    expect(result.mode).toBe("LIVE");
    expect(result.documents).toHaveLength(2);
    expect(seen).toHaveLength(2);
    expect(seen[0]).toContain("OC=top-secret");
    expect(JSON.stringify(result)).not.toContain("top-secret");
  });

  it("falls back to the verified snapshot when no secret is configured", async () => {
    const result = await searchLawApi({ target: "eflaw", query: "산업집적" }, { oc: "" });
    expect(result.mode).toBe("SNAPSHOT");
    expect(result.warnings.join(" ")).toContain("실시간 API 결과가 아니므로");
  });

  it("retries a transient upstream failure and caches the normalized result", async () => {
    let calls = 0;
    const success = { LawSearch: { totalCnt: "1", page: "1", law: { 법령ID: "1", 법령명한글: "건축법" } } };
    const fetchImpl = async () => {
      calls += 1;
      if (calls === 1) return new Response("temporary", { status: 503 });
      return new Response(JSON.stringify(success), { status: 200, headers: { "content-type": "application/json" } });
    };
    const first = await searchLawApi({ target: "law", query: "retry-cache-case" }, { oc: "secret", fetchImpl });
    const second = await searchLawApi({ target: "law", query: "retry-cache-case" }, { oc: "secret", fetchImpl });
    expect(first.mode).toBe("LIVE");
    expect(second.warnings.join(" ")).toContain("15분");
    expect(calls).toBe(2);
  });

  it("times out safely and returns snapshot mode", async () => {
    const fetchImpl = (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
    const result = await searchLawApi({ target: "eflaw", query: "timeout-case" }, { oc: "secret", fetchImpl, timeoutMs: 5 });
    expect(result.mode).toBe("SNAPSHOT");
    expect(result.warnings.join(" ")).toContain("TIMEOUT");
  });

  it("enforces the local upstream request rate guard", async () => {
    const payload = { LawSearch: { totalCnt: "1", page: "1", law: { 법령ID: "1", 법령명한글: "테스트법" } } };
    const fetchImpl = async () => new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
    const results = [];
    for (let index = 0; index < 21; index += 1) {
      results.push(await searchLawApi({ target: "law", query: `rate-case-${index}` }, { oc: "secret", fetchImpl }));
    }
    expect(results.at(-1)?.mode).toBe("SNAPSHOT");
    expect(results.at(-1)?.warnings.join(" ")).toContain("RATE_LIMITED");
  });
});
