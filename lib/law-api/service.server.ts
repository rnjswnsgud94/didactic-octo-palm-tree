import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import { LawApiError, parseLawPayload } from "@/lib/law-api/client.server";
import {
  lawBodyTargetSchema,
  lawHistoryTargetSchema,
  type LawBodyTarget,
  type LawHistoryResult,
  type LawHistoryTarget,
  type LawServiceResult,
} from "@/lib/law-api/types";

const API_ORIGIN = "https://www.law.go.kr";
const SERVICE_PATH = "/DRF/lawService.do";
const SEARCH_PATH = "/DRF/lawSearch.do";
const MAX_RESPONSE_BYTES = 5_000_000;
const TIMEOUT_MS = 6_000;
const CACHE_TTL_MS = 15 * 60 * 1000;
const RETRY_DELAYS_MS = [250, 750];
const recordSchema = z.record(z.string(), z.unknown());
const recentRequestTimes: number[] = [];

type FetchLike = typeof fetch;
type CachedResult = { expiresAt: number; value: LawServiceResult | LawHistoryResult };
const cache = new Map<string, CachedResult>();

const bodyRoots: Record<LawBodyTarget, string[]> = {
  eflaw: ["법령", "LawService"],
  eflawjosub: ["법령", "LawService"],
  law: ["법령", "LawService"],
  lawjosub: ["법령", "LawService"],
  admrul: ["AdmRulService", "행정규칙"],
  ordin: ["LawService", "OrdinService", "자치법규"],
};

const historyRoots: Record<LawHistoryTarget, string[]> = {
  lsHstInf: ["LawSearch", "법령변경이력목록"],
  lsJoHstInf: ["LawSearch", "조문변경이력목록"],
  delHst: ["LawSearch", "삭제데이터목록"],
};

function asRecord(value: unknown) {
  const parsed = recordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function upstreamError(top: Record<string, unknown>) {
  if (typeof top.result === "string" || typeof top.msg === "string") {
    throw new LawApiError("상류 API 인증 또는 요청 검증에 실패했습니다.", "UPSTREAM_AUTH");
  }
}

function findRoot(payload: unknown, candidates: string[]) {
  const top = asRecord(payload);
  if (!top) throw new LawApiError("상류 응답이 객체가 아닙니다.", "INVALID_SCHEMA");
  upstreamError(top);
  for (const rootName of candidates) {
    const root = asRecord(top[rootName]);
    if (root) return { rootName, root };
  }
  throw new LawApiError("조회대상과 일치하는 응답 루트가 없습니다.", "INVALID_SCHEMA");
}

function hashPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function asRecords(value: unknown): Record<string, unknown>[] {
  const values = Array.isArray(value) ? value : [value];
  return values.map(asRecord).filter((item): item is Record<string, unknown> => item !== null);
}

export function normalizeLawServicePayload(targetInput: LawBodyTarget, payload: unknown) {
  const target = lawBodyTargetSchema.parse(targetInput);
  const { rootName, root } = findRoot(payload, bodyRoots[target]);
  return { target, rootName, payload: root, contentHash: hashPayload(root) };
}

export function normalizeLawHistoryPayload(targetInput: LawHistoryTarget, payload: unknown) {
  const target = lawHistoryTargetSchema.parse(targetInput);
  const { rootName, root } = findRoot(payload, historyRoots[target]);
  const metadataKeys = new Set(["totalCnt", "총건수", "page", "페이지", "target"]);
  const items = Object.entries(root)
    .filter(([key]) => !metadataKeys.has(key))
    .flatMap(([, value]) => asRecords(value));
  return { target, rootName, items, contentHash: hashPayload(root) };
}

async function fetchPayload(url: URL, fetchImpl: FetchLike, timeoutMs: number) {
  if (url.protocol !== "https:" || url.hostname !== "www.law.go.kr") {
    throw new LawApiError("허용되지 않은 API 호스트입니다.", "INVALID_SCHEMA");
  }
  const now = Date.now();
  while (recentRequestTimes.length && recentRequestTimes[0] < now - 60_000) recentRequestTimes.shift();
  if (recentRequestTimes.length >= 20) throw new LawApiError("상류 API 보호를 위한 애플리케이션 호출 한도에 도달했습니다.", "RATE_LIMITED");
  recentRequestTimes.push(now);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await fetchImpl(url, { method: "GET", cache: "no-store", signal: controller.signal, headers: { Accept: "application/json, application/xml;q=0.8" } });
        if (!response.ok) {
          if ((response.status === 429 || response.status >= 500) && attempt < RETRY_DELAYS_MS.length) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
            continue;
          }
          throw new LawApiError(`상류 API 오류(${response.status})`, "UPSTREAM_HTTP");
        }
        const text = await response.text();
        if (text.length > MAX_RESPONSE_BYTES) throw new LawApiError("상류 응답이 허용 크기를 초과했습니다.", "RESPONSE_TOO_LARGE");
        return parseLawPayload(text, response.headers.get("content-type") ?? "");
      } catch (error) {
        if (error instanceof LawApiError) throw error;
        if (controller.signal.aborted) throw new LawApiError("상류 API 요청 시간이 초과되었습니다.", "TIMEOUT");
        if (attempt < RETRY_DELAYS_MS.length) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        throw new LawApiError("상류 API 통신에 실패했습니다.", "UPSTREAM_HTTP");
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

function cacheValue<T extends LawServiceResult | LawHistoryResult>(key: string, value: T) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value;
}

function cachedValue<T extends LawServiceResult | LawHistoryResult>(key: string) {
  const cached = cache.get(key);
  return cached && cached.expiresAt > Date.now() ? cached.value as T : null;
}

export async function fetchLawBody(
  input: { target: LawBodyTarget; mst?: string; id?: string; jo?: string },
  options: { oc?: string; fetchImpl?: FetchLike; timeoutMs?: number; now?: Date } = {},
): Promise<LawServiceResult> {
  const target = lawBodyTargetSchema.parse(input.target);
  const now = (options.now ?? new Date()).toISOString();
  const key = `body:${target}:${input.mst ?? ""}:${input.id ?? ""}:${input.jo ?? ""}`;
  const cached = cachedValue<LawServiceResult>(key);
  if (cached) return { ...cached, warnings: [...cached.warnings, "15분 애플리케이션 캐시에서 조회했습니다."] };
  const oc = options.oc ?? process.env.LAW_API_OC;
  if (!oc) return { mode: "SNAPSHOT", target, rootName: null, payload: null, contentHash: null, collectedAt: now, warnings: ["LAW_API_OC가 없어 본문 실시간 조회를 수행하지 않았습니다."] };

  const url = new URL(SERVICE_PATH, API_ORIGIN);
  url.search = new URLSearchParams({ OC: oc, target, type: "JSON", ...(input.mst ? { MST: input.mst } : {}), ...(input.id ? { ID: input.id } : {}), ...(input.jo ? { JO: input.jo } : {}) }).toString();
  try {
    const normalized = normalizeLawServicePayload(target, await fetchPayload(url, options.fetchImpl ?? fetch, options.timeoutMs ?? TIMEOUT_MS));
    return cacheValue(key, { mode: "LIVE", ...normalized, collectedAt: now, warnings: ["본문은 검증자료이며 운영 판정규칙을 자동 변경하지 않습니다."] });
  } catch (error) {
    return { mode: "SNAPSHOT", target, rootName: null, payload: null, contentHash: null, collectedAt: now, warnings: [`본문 조회 실패(${error instanceof LawApiError ? error.code : "UNKNOWN"}); 기존 검증자료를 유지합니다.`] };
  }
}

export async function fetchLawHistory(
  input: { target: LawHistoryTarget; date: string },
  options: { oc?: string; fetchImpl?: FetchLike; timeoutMs?: number; now?: Date } = {},
): Promise<LawHistoryResult> {
  const target = lawHistoryTargetSchema.parse(input.target);
  const now = (options.now ?? new Date()).toISOString();
  const key = `history:${target}:${input.date}`;
  const cached = cachedValue<LawHistoryResult>(key);
  if (cached) return { ...cached, warnings: [...cached.warnings, "15분 애플리케이션 캐시에서 조회했습니다."] };
  const oc = options.oc ?? process.env.LAW_API_OC;
  if (!oc) return { mode: "SNAPSHOT", target, rootName: null, items: [], contentHash: null, collectedAt: now, warnings: ["LAW_API_OC가 없어 변경·삭제 이력 실시간 조회를 수행하지 않았습니다."] };

  const url = new URL(SEARCH_PATH, API_ORIGIN);
  url.search = new URLSearchParams({ OC: oc, target, type: "JSON", date: input.date }).toString();
  try {
    const normalized = normalizeLawHistoryPayload(target, await fetchPayload(url, options.fetchImpl ?? fetch, options.timeoutMs ?? TIMEOUT_MS));
    return cacheValue(key, { mode: "LIVE", ...normalized, collectedAt: now, warnings: ["변경목록은 영향검토 입력이며 운영 규칙을 자동 변경하지 않습니다."] });
  } catch (error) {
    return { mode: "SNAPSHOT", target, rootName: null, items: [], contentHash: null, collectedAt: now, warnings: [`변경이력 조회 실패(${error instanceof LawApiError ? error.code : "UNKNOWN"}); 자동 변경을 중단합니다.`] };
  }
}

export function resetLawServiceMemoryStateForTests() {
  cache.clear();
  recentRequestTimes.splice(0, recentRequestTimes.length);
}
