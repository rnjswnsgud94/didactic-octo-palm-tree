import "server-only";

import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import { getSnapshotResult } from "@/lib/law-api/snapshot";
import {
  lawTargetSchema,
  type LawDataResult,
  type LawTarget,
  type NormalizedLawDocument,
} from "@/lib/law-api/types";

const API_ORIGIN = "https://www.law.go.kr";
const SEARCH_PATH = "/DRF/lawSearch.do";
const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const MAX_RESPONSE_BYTES = 5_000_000;
const CACHE_TTL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 6_000;
const RETRY_DELAYS_MS = [250, 750];

type FetchLike = typeof fetch;

type CacheValue = {
  expiresAt: number;
  documents: NormalizedLawDocument[];
  collectedAt: string;
};

const responseCache = new Map<string, CacheValue>();
const recentRequestTimes: number[] = [];

export class LawApiError extends Error {
  constructor(
    message: string,
    readonly code:
      | "MISSING_SECRET"
      | "RATE_LIMITED"
      | "UPSTREAM_AUTH"
      | "UPSTREAM_HTTP"
      | "EMPTY_RESPONSE"
      | "INVALID_SCHEMA"
      | "RESPONSE_TOO_LARGE"
      | "TIMEOUT",
  ) {
    super(message);
    this.name = "LawApiError";
  }
}

function applyLocalRateLimit(now = Date.now()) {
  while (recentRequestTimes.length && recentRequestTimes[0] < now - 60_000) {
    recentRequestTimes.shift();
  }
  if (recentRequestTimes.length >= 20) {
    throw new LawApiError("상류 API 보호를 위한 애플리케이션 호출 한도에 도달했습니다.", "RATE_LIMITED");
  }
  recentRequestTimes.push(now);
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return null;
}

function publicLawUrl(target: LawTarget, title: string) {
  const category = target === "admrul" ? "행정규칙" : target === "ordin" ? "자치법규" : "법령";
  return `${API_ORIGIN}/${encodeURIComponent(category)}/${encodeURIComponent(title)}`;
}

function rootForTarget(target: LawTarget) {
  if (target === "admrul") return "AdmRulSearch";
  if (target === "ordin") return "OrdinSearch";
  return "LawSearch";
}

function itemCandidates(target: LawTarget) {
  if (target === "admrul") return ["admrul", "AdmRul", "행정규칙"];
  if (target === "ordin") return ["ordin", "자치법규"];
  return ["law", "법령"];
}

export function normalizeSearchPayload(
  targetInput: LawTarget,
  payload: unknown,
): { totalCount: number; page: number; documents: NormalizedLawDocument[] } {
  const target = lawTargetSchema.parse(targetInput);
  const top = asRecord(payload);
  if (!top) throw new LawApiError("상류 응답이 객체가 아닙니다.", "INVALID_SCHEMA");
  if (typeof top.result === "string" || typeof top.msg === "string") {
    throw new LawApiError("상류 API 인증 또는 요청 검증에 실패했습니다.", "UPSTREAM_AUTH");
  }
  const root = asRecord(top[rootForTarget(target)]);
  if (!root) throw new LawApiError("대상별 응답 루트가 없습니다.", "INVALID_SCHEMA");
  const totalCount = Number(firstString(root, ["totalCnt", "총건수"]) ?? "0");
  const page = Number(firstString(root, ["page", "페이지"]) ?? "1");
  let rawItems: unknown[] = [];
  for (const key of itemCandidates(target)) {
    if (key in root) {
      rawItems = asArray(root[key]);
      break;
    }
  }
  const documents = rawItems.map((raw) => {
    const item = asRecord(raw);
    if (!item) throw new LawApiError("목록 항목 형식이 올바르지 않습니다.", "INVALID_SCHEMA");
    const title = firstString(item, ["법령명한글", "법령명_한글", "행정규칙명", "자치법규명", "title"]);
    if (!title) throw new LawApiError("목록 항목에 문서명이 없습니다.", "INVALID_SCHEMA");
    return {
      target,
      id: firstString(item, ["법령ID", "행정규칙ID", "자치법규ID", "LID"]),
      mst: firstString(item, ["법령일련번호", "행정규칙일련번호", "자치법규일련번호", "MST"]),
      title,
      promulgationDate: firstString(item, ["공포일자", "발령일자"]),
      proclamationNumber: firstString(item, ["공포번호", "발령번호"]),
      effectiveDate: firstString(item, ["시행일자"]),
      publicUrl: publicLawUrl(target, title),
    } satisfies NormalizedLawDocument;
  });
  if (!Number.isFinite(totalCount) || !Number.isFinite(page)) {
    throw new LawApiError("페이지 정보가 숫자 형식이 아닙니다.", "INVALID_SCHEMA");
  }
  return { totalCount, page, documents };
}

export function parseLawPayload(text: string, contentType: string) {
  if (!text.trim()) throw new LawApiError("상류 API가 빈 응답을 반환했습니다.", "EMPTY_RESPONSE");
  if (text.length > MAX_RESPONSE_BYTES) {
    throw new LawApiError("상류 응답이 허용 크기를 초과했습니다.", "RESPONSE_TOO_LARGE");
  }
  if (contentType.includes("json") || text.trimStart().startsWith("{")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new LawApiError("JSON 응답을 해석할 수 없습니다.", "INVALID_SCHEMA");
    }
  }
  try {
    return new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      parseTagValue: false,
      parseAttributeValue: false,
    }).parse(text) as unknown;
  } catch {
    throw new LawApiError("XML 응답을 해석할 수 없습니다.", "INVALID_SCHEMA");
  }
}

async function fetchPage(
  fetchImpl: FetchLike,
  params: URLSearchParams,
  signal?: AbortSignal,
) {
  applyLocalRateLimit();
  const url = new URL(SEARCH_PATH, API_ORIGIN);
  url.search = params.toString();
  if (url.protocol !== "https:" || url.hostname !== "www.law.go.kr") {
    throw new LawApiError("허용되지 않은 API 호스트입니다.", "INVALID_SCHEMA");
  }

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json, application/xml;q=0.8" },
        cache: "no-store",
        signal,
      });
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < RETRY_DELAYS_MS.length) {
          await sleep(RETRY_DELAYS_MS[attempt]);
          continue;
        }
        throw new LawApiError(`상류 API 오류(${response.status})`, "UPSTREAM_HTTP");
      }
      return parseLawPayload(await response.text(), response.headers.get("content-type") ?? "");
    } catch (error) {
      if (error instanceof LawApiError) throw error;
      if (signal?.aborted) throw new LawApiError("상류 API 요청 시간이 초과되었습니다.", "TIMEOUT");
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw new LawApiError("상류 API 통신에 실패했습니다.", "UPSTREAM_HTTP");
    }
  }
}

export async function searchLawApi(
  {
    target,
    query,
  }: {
    target: LawTarget;
    query: string;
  },
  options: { fetchImpl?: FetchLike; oc?: string; now?: Date; timeoutMs?: number } = {},
): Promise<LawDataResult> {
  const safeTarget = lawTargetSchema.parse(target);
  const normalizedQuery = query.trim().slice(0, 80);
  const oc = options.oc ?? process.env.LAW_API_OC;
  if (!oc) return getSnapshotResult(normalizedQuery, safeTarget);

  const cacheKey = createHash("sha256")
    .update(`${safeTarget}\0${normalizedQuery}`)
    .digest("hex");
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      mode: "LIVE",
      documents: cached.documents,
      collectedAt: cached.collectedAt,
      verifiedAt: cached.collectedAt,
      stale: false,
      warnings: ["15분 애플리케이션 캐시에서 조회했습니다."],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  try {
    const documents: NormalizedLawDocument[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const params = new URLSearchParams({
        OC: oc,
        target: safeTarget,
        type: "JSON",
        display: String(PAGE_SIZE),
        page: String(page),
      });
      if (normalizedQuery) params.set("query", normalizedQuery);
      if (safeTarget === "eflaw") params.set("nw", "3");
      const payload = await fetchPage(options.fetchImpl ?? fetch, params, controller.signal);
      const normalized = normalizeSearchPayload(safeTarget, payload);
      documents.push(...normalized.documents);
      if (documents.length >= normalized.totalCount || normalized.documents.length === 0) break;
      if (page === MAX_PAGES) {
        throw new LawApiError("페이지 안전 한도를 초과했습니다.", "INVALID_SCHEMA");
      }
    }
    const collectedAt = (options.now ?? new Date()).toISOString();
    responseCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      documents,
      collectedAt,
    });
    return {
      mode: "LIVE",
      documents,
      collectedAt,
      verifiedAt: collectedAt,
      stale: false,
      warnings: ["법령 원문·메타데이터 검증용 조회이며 사업 적용판정을 자동 변경하지 않습니다."],
    };
  } catch (error) {
    const snapshot = getSnapshotResult(normalizedQuery, safeTarget);
    return {
      ...snapshot,
      warnings: [
        `실시간 조회 실패로 검증 스냅숏을 사용합니다(${error instanceof LawApiError ? error.code : "UNKNOWN"}).`,
        ...snapshot.warnings,
      ],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function resetLawApiMemoryStateForTests() {
  responseCache.clear();
  recentRequestTimes.splice(0, recentRequestTimes.length);
}
