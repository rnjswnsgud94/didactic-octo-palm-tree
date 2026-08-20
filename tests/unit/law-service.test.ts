import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { parseLawPayload } from "@/lib/law-api/client.server";
import { fetchLawBody, fetchLawHistory, normalizeLawHistoryPayload, normalizeLawServicePayload, resetLawServiceMemoryStateForTests } from "@/lib/law-api/service.server";

const fixtureDirectory = join(process.cwd(), "tests", "fixtures", "law-api");

describe("law body and change-history adapters", () => {
  beforeEach(() => resetLawServiceMemoryStateForTests());

  it("normalizes law XML and preserves ID, MST and JO-like leading zeroes", () => {
    const xml = readFileSync(join(fixtureDirectory, "body-eflaw.xml"), "utf8");
    const result = normalizeLawServicePayload("eflaw", parseLawPayload(xml, "application/xml"));
    expect(result.rootName).toBe("법령");
    expect(JSON.stringify(result.payload)).toContain("001234");
    expect(JSON.stringify(result.payload)).toContain("0284085");
    expect(JSON.stringify(result.payload)).toContain("0013");
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses the target-specific administrative-rule root", () => {
    const payload = JSON.parse(readFileSync(join(fixtureDirectory, "body-admrul.json"), "utf8")) as unknown;
    const result = normalizeLawServicePayload("admrul", payload);
    expect(result.rootName).toBe("AdmRulService");
    expect(JSON.stringify(result.payload)).toContain("000077");
    expect(() => normalizeLawServicePayload("ordin", payload)).toThrow(/루트/);
  });

  it("normalizes the official delHst deletion target", () => {
    const payload = JSON.parse(readFileSync(join(fixtureDirectory, "history-delete.json"), "utf8")) as unknown;
    const result = normalizeLawHistoryPayload("delHst", payload);
    expect(result.rootName).toBe("LawSearch");
    expect(result.items[0]).toMatchObject({ 법령ID: "000123", 법령일련번호: "004567" });
  });

  it("does not attempt body or history calls without the server secret", async () => {
    const body = await fetchLawBody({ target: "eflaw", mst: "0284085" }, { oc: "" });
    const history = await fetchLawHistory({ target: "lsHstInf", date: "20260820" }, { oc: "" });
    expect(body).toMatchObject({ mode: "SNAPSHOT", payload: null });
    expect(history).toMatchObject({ mode: "SNAPSHOT", items: [] });
  });

  it("caches a validated body without returning the OC", async () => {
    const xml = readFileSync(join(fixtureDirectory, "body-eflaw.xml"), "utf8");
    let calls = 0;
    const fetchImpl = async () => { calls += 1; return new Response(xml, { status: 200, headers: { "content-type": "application/xml" } }); };
    const first = await fetchLawBody({ target: "eflaw", mst: "0284085" }, { oc: "secret-value", fetchImpl });
    const second = await fetchLawBody({ target: "eflaw", mst: "0284085" }, { oc: "secret-value", fetchImpl });
    expect(first.mode).toBe("LIVE");
    expect(second.warnings.join(" ")).toContain("15분");
    expect(calls).toBe(1);
    expect(JSON.stringify([first, second])).not.toContain("secret-value");
  });
});
