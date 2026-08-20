import "server-only";

import type { OfficialOrdinanceRecord } from "@/lib/regions/ordinance-resolution";
import {
  getReviewedElisOrdinanceRecords,
  reviewedElisSnapshotCheckedAt,
} from "@/lib/regions/elis-reviewed-snapshot";
import {
  buildElisOrdinanceDetailUrl,
  type ElisJurisdictionTarget,
} from "@/lib/regions/local-ordinances";

const ELIS_HOST = "www.elis.go.kr";
const ELIS_LIST_PATH = "/alrpop/locgovAlrPopup";
const MAX_RESPONSE_BYTES = 2_000_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 15_000;

type FetchLike = typeof fetch;

type CacheValue = {
  expiresAt: number;
  checkedAt: string;
  records: OfficialOrdinanceRecord[];
};

export type ElisLookupMode = "LIVE" | "REVIEWED";

export interface ElisLookupResult {
  mode: ElisLookupMode;
  checkedAt: string;
  records: OfficialOrdinanceRecord[];
}

const responseCache = new Map<string, CacheValue>();

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    middot: "·",
    nbsp: " ",
    quot: '"',
  };
  return value
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function plainText(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, " "))
    .replace(/[\t\r\n ]+/g, " ")
    .trim();
}

function displayDate(row: string): string | null {
  const separated = row.match(/\b(20\d{2})[./-](\d{2})[./-](\d{2})\b/);
  if (separated) return `${separated[1]}-${separated[2]}-${separated[3]}`;
  const compact = row.match(/\b(20\d{2})(\d{2})(\d{2})\b/);
  return compact ? `${compact[1]}-${compact[2]}-${compact[3]}` : null;
}

function popupIdentifiers(fragment: string): { alrNo: string; histNo: string } | null {
  const call = fragment.match(/lawPopup\s*\(([^)]*)\)/i)?.[1];
  if (!call) return null;
  const values = [...call.matchAll(/['"]([^'"]*)['"]/g)].map((match) => match[1]);
  for (let index = values.length - 2; index >= 0; index -= 1) {
    if (/^\d{14}$/.test(values[index]) && /^\d{3}$/.test(values[index + 1] ?? "")) {
      return { alrNo: values[index], histNo: values[index + 1] };
    }
  }
  return null;
}

function ordinanceLink(
  row: string,
): { name: string; alrNo: string; histNo: string } | null {
  const anchors = row.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? [];
  for (const anchor of anchors) {
    const ids = popupIdentifiers(anchor);
    const name = plainText(anchor);
    if (ids && name) return { name, ...ids };
  }
  return null;
}

/** Parse the public, server-rendered ELIS current-ordinance table. */
export function parseElisOrdinanceListHtml(
  html: string,
  target: Pick<ElisJurisdictionTarget, "name" | "level">,
): OfficialOrdinanceRecord[] {
  if (new TextEncoder().encode(html).byteLength > MAX_RESPONSE_BYTES) {
    throw new Error("ELIS 응답이 허용 크기를 초과했습니다.");
  }

  const records: OfficialOrdinanceRecord[] = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const row = rowMatch[0];
    const linked = ordinanceLink(row);
    if (!linked) continue;
    records.push({
      name: linked.name,
      level: target.level,
      jurisdictionName: target.name,
      amendmentDate: displayDate(plainText(row)),
      url: buildElisOrdinanceDetailUrl(
        linked.name,
        linked.alrNo,
        linked.histNo,
      ),
    });
  }

  return records.filter(
    (record, index, list) =>
      list.findIndex(
        (candidate) => candidate.name === record.name && candidate.url === record.url,
      ) === index,
  );
}

function reviewedForTarget(
  target: ElisJurisdictionTarget,
  provinceName: string,
): OfficialOrdinanceRecord[] {
  return getReviewedElisOrdinanceRecords(
    provinceName,
    target.name,
    target.level,
  );
}

export async function fetchElisOrdinanceRecords(
  target: ElisJurisdictionTarget,
  provinceName: string,
  options: { fetchImpl?: FetchLike; now?: Date; timeoutMs?: number } = {},
): Promise<ElisLookupResult> {
  const url = new URL(target.listUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== ELIS_HOST ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    url.pathname !== ELIS_LIST_PATH ||
    url.hash !== "" ||
    !/^\d{2}$/.test(url.searchParams.get("ctpvCd") ?? "") ||
    !/^\d{3}$/.test(url.searchParams.get("sggCd") ?? "") ||
    [...url.searchParams.keys()].some(
      (key) => key !== "ctpvCd" && key !== "sggCd",
    )
  ) {
    throw new Error("허용되지 않은 ELIS 조회 주소입니다.");
  }

  const cached = responseCache.get(url.toString());
  if (cached && cached.expiresAt > Date.now()) {
    return { mode: "LIVE", checkedAt: cached.checkedAt, records: cached.records };
  }

  const reviewed = reviewedForTarget(target, provinceName);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      method: "GET",
      headers: { Accept: "text/html;charset=UTF-8" },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`ELIS 응답 오류(${response.status})`);
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_RESPONSE_BYTES) {
      throw new Error("ELIS 응답이 허용 크기를 초과했습니다.");
    }
    const records = parseElisOrdinanceListHtml(await response.text(), target);
    if (!records.length) throw new Error("ELIS 현행 자치법규를 해석하지 못했습니다.");
    const checkedAt = (options.now ?? new Date()).toISOString();
    responseCache.set(url.toString(), {
      expiresAt: Date.now() + CACHE_TTL_MS,
      checkedAt,
      records,
    });
    return { mode: "LIVE", checkedAt, records };
  } catch (error) {
    if (!reviewed.length) throw error;
    return {
      mode: "REVIEWED",
      checkedAt: reviewedElisSnapshotCheckedAt,
      records: reviewed,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function resetElisClientMemoryStateForTests() {
  responseCache.clear();
}
