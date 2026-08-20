"use client";

import { useEffect, useMemo, useState } from "react";

import { tabLabels, type DashboardTab } from "@/app/components/dashboard/constants";
import { DashboardTabIcon } from "@/app/components/dashboard/DashboardTabIcon";
import { GapsView, LegalView, ProcedureList, ScheduleView } from "@/app/components/dashboard/DashboardViews";
import { ProcedureDrawer } from "@/app/components/dashboard/ProcedureDrawer";
import { findExactScenarioId, ScenarioPicker } from "@/app/components/dashboard/ScenarioPicker";
import { Swimlane } from "@/app/components/dashboard/Swimlane";
import { Wizard } from "@/app/components/dashboard/Wizard";
import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import type { ApplicabilityStatus } from "@/lib/domain/schemas";
import { evaluateProject } from "@/lib/engine/pipeline";
import type { DurationScenario } from "@/lib/engine/schedule";
import { decodeShareState, encodeShareState } from "@/lib/share-state";

const defaultScenario = catalog.scenarios[0];
const validTabs = new Set(Object.keys(tabLabels));
const statusOrder: ApplicabilityStatus[] = ["APPLIES", "POSSIBLY_APPLIES", "NEEDS_MORE_INFO", "DOES_NOT_APPLY"];
const summaryLabels: Record<ApplicabilityStatus, string> = {
  APPLIES: "적용 절차",
  POSSIBLY_APPLIES: "적용 가능성",
  NEEDS_MORE_INFO: "추가정보 필요",
  DOES_NOT_APPLY: "비적용",
};

export function DashboardClient() {
  const [answers, setAnswers] = useState<ScenarioAnswers>(defaultScenario.answers);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(defaultScenario.id);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState<DashboardTab>("SWIMLANE");
  const [durationScenario, setDurationScenario] = useState<DurationScenario>("BASE");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("ALL");
  const [showExcluded, setShowExcluded] = useState(false);
  const [requiredOnly, setRequiredOnly] = useState(false);
  const [includeConditional, setIncludeConditional] = useState(true);
  const [includePractical, setIncludePractical] = useState(true);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const restored = decodeShareState(window.location.search, defaultScenario.answers);
      setAnswers(restored.answers);
      const restoredScenarioId = catalog.scenarios.some((scenario) => scenario.id === restored.scenarioId)
        ? restored.scenarioId!
        : findExactScenarioId(catalog.scenarios, restored.answers) ?? null;
      setSelectedScenarioId(restoredScenarioId);
      if (restored.tab && validTabs.has(restored.tab)) setActiveTab(restored.tab as DashboardTab);
      if (restored.warning) setShareMessage(restored.warning);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const query = encodeShareState(answers, activeTab, selectedScenarioId);
      window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [answers, activeTab, selectedScenarioId]);

  const evaluation = useMemo(() => evaluateProject(answers, { includeConditional, includePractical }), [answers, includeConditional, includePractical]);
  const schedule = evaluation.schedules[durationScenario];
  const domains = useMemo(() => [...new Set(evaluation.decisions.map((decision) => decision.procedure.domain))].sort(), [evaluation.decisions]);
  const filteredDecisions = evaluation.decisions.filter((decision) => {
    if (!showExcluded && decision.status === "DOES_NOT_APPLY") return false;
    if (requiredOnly && decision.status !== "APPLIES") return false;
    if (domain !== "ALL" && decision.procedure.domain !== domain) return false;
    const legalText = decision.procedure.citationIds.map((citationId) => {
      const citation = catalog.citations.find((item) => item.id === citationId);
      const source = catalog.legalSources.find((item) => item.id === citation?.sourceId);
      return `${source?.title ?? ""} ${citation?.article ?? ""} ${citation?.summary ?? ""}`;
    }).join(" ");
    const haystack = `${decision.procedure.name} ${decision.procedure.aliases.join(" ")} ${decision.procedure.receivingAuthority} ${legalText}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  const selectedDecision = evaluation.decisions.find((decision) => decision.procedure.id === selectedId) ?? null;

  function changeAnswer<K extends keyof ScenarioAnswers>(key: K, value: ScenarioAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function selectScenario(scenarioId: string) {
    const scenario = catalog.scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    setSelectedScenarioId(scenario.id);
    setAnswers(scenario.answers);
  }

  async function copyShareLink() {
    const link = `${window.location.origin}${window.location.pathname}?${encodeShareState(answers, activeTab, selectedScenarioId)}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareMessage("현재 조건의 공유 링크를 복사했습니다.");
    } catch {
      setShareMessage("주소창의 링크를 복사해 공유해 주세요.");
    }
    window.setTimeout(() => setShareMessage(""), 2600);
  }

  function resetDashboard() {
    setAnswers(defaultScenario.answers);
    setSelectedScenarioId(defaultScenario.id);
    setActiveStep(0);
    setActiveTab("SWIMLANE");
    setDurationScenario("BASE");
    setSelectedId(null);
    setSearch("");
    setDomain("ALL");
    setShowExcluded(false);
    setRequiredOnly(false);
    setIncludeConditional(true);
    setIncludePractical(true);
  }

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <a className="brand" href="#main-dashboard" aria-label="국내 공장 인허가 대시보드 홈">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>국내 공장 인허가</strong><small>투자 프로젝트 대시보드</small></span>
        </a>
        <div className="topbar-meta">
          <span className="data-health"><i /> 법령 스냅샷 · {catalog.coverage.lastLegalReviewAt}</span>
          <button type="button" className="share-button" onClick={copyShareLink}>공유 링크 복사</button>
        </div>
      </header>

      <section className="hero-band" aria-labelledby="dashboard-title">
        <div><span className="eyebrow">FACTORY PERMIT NAVIGATOR · MVP</span><h1 id="dashboard-title">투자조건에서 인허가 경로까지,<br />근거와 일정으로 연결합니다.</h1><p>전국 공통 법령을 기준으로 비수도권 제조업 투자 시나리오를 지원합니다.</p></div>
        <div className="scope-card"><span>현재 적용 범위</span><strong>전국 비수도권 14개 시·도</strong><small>서울·경기·인천 제외 · 지역 조례·개별 산단 계획은 추가 확인</small></div>
      </section>

      <div id="main-dashboard" className="dashboard-grid">
        <Wizard answers={answers} activeStep={activeStep} onStepChange={setActiveStep} onChange={changeAnswer} />
        <section className="workspace" aria-label="판정 결과">
          <div className="workspace-toolbar">
            <ScenarioPicker scenarios={catalog.scenarios} answers={answers} selectedScenarioId={selectedScenarioId} onSelect={selectScenario} />
            <div className="scenario-caption"><strong>{answers.city || `${answers.province} 내 시·군·구 미확인`} · {answers.insideIndustrialComplex === null ? "입지 미확인" : answers.insideIndustrialComplex ? "산업단지" : "개별입지"}</strong><span>{answers.totalAreaM2 === null ? "면적 미확인" : `${answers.totalAreaM2.toLocaleString("ko-KR")}㎡`} · 기준일 {answers.assessmentDate}</span><em>전국 공통 법령층 · 지역기준 추가 확인</em></div>
            <div className="utility-actions"><button type="button" onClick={resetDashboard}>초기화</button><button type="button" onClick={() => window.print()}>인쇄</button></div>
          </div>

          <div className="summary-strip" aria-label="판정 요약">
            {statusOrder.map((status) => <div className={`summary-card summary-${status.toLowerCase()}`} key={status}><span>{summaryLabels[status]}</span><strong>{evaluation.counts[status]}</strong></div>)}
            <div className="summary-card summary-schedule"><span>부분 일정</span><strong>{schedule.total}<small> 영업일</small></strong></div>
          </div>
          <div className="decision-banner" role="note"><span className="decision-icon" aria-hidden="true">i</span><p><strong>판정은 최종 처분이 아닙니다.</strong> 입력 사실과 수록 근거에 따른 검토 출발점이며, 실제 신청 전 관할기관 확인이 필요합니다.</p></div>

          <div className="tab-row">
            <nav className="dashboard-tabs" aria-label="결과 보기" role="tablist">
              {(Object.keys(tabLabels) as DashboardTab[]).map((tab) => <button id={`tab-${tab}`} aria-controls="dashboard-result-panel" key={tab} type="button" className={activeTab === tab ? "is-active" : ""} aria-selected={activeTab === tab} role="tab" onClick={() => setActiveTab(tab)}><DashboardTabIcon tab={tab} />{tabLabels[tab]}</button>)}
            </nav>
            <div className="scenario-switch" aria-label="기간 시나리오">
              {(["MIN", "BASE", "MAX"] as DurationScenario[]).map((scenario) => <button type="button" key={scenario} className={durationScenario === scenario ? "is-selected" : ""} onClick={() => setDurationScenario(scenario)}>{scenario === "MIN" ? "최소" : scenario === "BASE" ? "기준" : "최대"}</button>)}
            </div>
          </div>

          {activeTab === "SWIMLANE" || activeTab === "LIST" ? (
            <div className="filterbar">
              <label className="search-field"><span className="sr-only">절차 검색</span><i aria-hidden="true" /><input type="search" placeholder="절차·기관 검색" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <label><span className="sr-only">분야 필터</span><select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="ALL">모든 분야</option>{domains.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="check-control"><input type="checkbox" checked={includeConditional} onChange={(event) => setIncludeConditional(event.target.checked)} /><span>조건부 일정 포함</span></label>
              <label className="check-control"><input type="checkbox" checked={requiredOnly} onChange={(event) => setRequiredOnly(event.target.checked)} /><span>필수만 보기</span></label>
              <label className="check-control"><input type="checkbox" checked={includePractical} onChange={(event) => setIncludePractical(event.target.checked)} /><span>실무 선행 포함</span></label>
              <label className="check-control"><input type="checkbox" checked={showExcluded} onChange={(event) => setShowExcluded(event.target.checked)} /><span>비적용 표시</span></label>
            </div>
          ) : null}

          <div id="dashboard-result-panel" className="view-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            {activeTab === "SWIMLANE" ? <Swimlane decisions={filteredDecisions} schedule={schedule} selectedId={selectedId} onSelect={setSelectedId} /> : null}
            {activeTab === "LIST" ? <ProcedureList decisions={filteredDecisions} schedule={schedule} onSelect={setSelectedId} /> : null}
            {activeTab === "SCHEDULE" ? <ScheduleView schedule={schedule} /> : null}
            {activeTab === "LEGAL" ? <LegalView decisions={evaluation.decisions.filter((decision) => decision.status !== "DOES_NOT_APPLY")} onSelect={setSelectedId} /> : null}
            {activeTab === "GAPS" ? <GapsView decisions={evaluation.decisions} /> : null}
          </div>
        </section>
      </div>

      <footer className="dashboard-footer"><p>{catalog.coverage.disclaimer}</p><span>데이터 버전 {catalog.coverage.catalogVersion} · 출처 {catalog.coverage.sourceAttribution}</span></footer>
      <ProcedureDrawer decision={selectedDecision} schedule={schedule} onClose={() => setSelectedId(null)} />
      {shareMessage ? <div className="toast" role="status">{shareMessage}</div> : null}
    </main>
  );
}
