"use client";

import { useEffect, useMemo, useState } from "react";

const LIVE_VERIFICATION_URL = "https://factory-permit-dashboard.rnjswnsgud94.chatgpt.site";

type SourceOption = {
  id: string;
  title: string;
  mst: string | null;
  article: string | null;
  officialUrl: string;
};

type VerificationResult = {
  mode: "LIVE" | "SNAPSHOT";
  document: { title: string; effectiveDate: string | null; publicUrl: string } | null;
  search: { collectedAt: string | null; verifiedAt: string; stale: boolean };
  body: { mode: "LIVE" | "SNAPSHOT"; contentHash: string | null; collectedAt: string } | null;
  warnings: string[];
};

function articleNumber(article: string | null) {
  const match = article?.match(/제(\d+)조/);
  return match?.[1];
}

export function isGithubPagesHostname(hostname: string) {
  return hostname.toLowerCase().endsWith(".github.io");
}

export function LawApiVerifier({ sources }: { sources: SourceOption[] }) {
  const uniqueSources = useMemo(
    () => [...new Map(sources.map((source) => [source.id, source])).values()],
    [sources],
  );
  const [selectedId, setSelectedId] = useState(uniqueSources[0]?.id ?? "");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isStaticMirror, setIsStaticMirror] = useState(false);
  const selected = uniqueSources.find((source) => source.id === selectedId) ?? uniqueSources[0];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsStaticMirror(isGithubPagesHostname(window.location.hostname));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!selected) return null;

  async function verify() {
    if (isGithubPagesHostname(window.location.hostname)) {
      setIsStaticMirror(true);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    const params = new URLSearchParams({ title: selected.title });
    if (selected.mst) params.set("mst", selected.mst);
    const jo = articleNumber(selected.article);
    if (jo) params.set("jo", jo);
    try {
      const response = await fetch(`/api/law/verify?${params.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("API 검증 요청에 실패했습니다.");
      setResult(await response.json() as VerificationResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "API 검증 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="law-api-verifier">
      <div className="law-api-controls">
        <label>
          <span>국가법령정보센터 API 대상</span>
          <select value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setResult(null); setError(""); }}>
            {uniqueSources.map((source) => <option key={source.id} value={source.id}>{source.title}{source.article ? ` · ${source.article}` : ""}</option>)}
          </select>
        </label>
        {isStaticMirror ? (
          <a href={LIVE_VERIFICATION_URL} target="_blank" rel="noreferrer">운영 사이트에서 API 확인 ↗</a>
        ) : (
          <button type="button" onClick={verify} disabled={loading}>{loading ? "조회 중…" : "API 최신성 확인"}</button>
        )}
      </div>
      {isStaticMirror ? (
        <div className="law-api-result is-snapshot" role="status">
          <strong>GitHub Pages 정적 미러</strong>
          <span>실시간 API 최신성 확인은 운영 사이트에서 제공됩니다.</span>
          <small>대시보드 판정과 공유 링크는 이 페이지에서도 그대로 사용할 수 있습니다.</small>
          <a href={selected.officialUrl} target="_blank" rel="noreferrer">선택 법령 공식 원문 열기 ↗</a>
        </div>
      ) : null}
      {result ? (
        <div className={`law-api-result is-${result.mode.toLowerCase()}`} role="status">
          <strong>{result.mode === "LIVE" ? "실시간 본문 확인" : "검증 스냅숏"}</strong>
          <span>{result.document?.title ?? selected.title} · 시행 {result.document?.effectiveDate ?? "추가 확인"}</span>
          <small>{result.body?.contentHash ? `본문 해시 ${result.body.contentHash.slice(0, 12)}… · ` : ""}검증 {result.body?.collectedAt ?? result.search.verifiedAt}</small>
          {result.warnings.length ? <p>{result.warnings.join(" · ")}</p> : null}
          <a href={result.document?.publicUrl ?? selected.officialUrl} target="_blank" rel="noreferrer">공식 원문 열기 ↗</a>
        </div>
      ) : null}
      {error ? <p className="law-api-error" role="alert">{error}</p> : null}
    </div>
  );
}
