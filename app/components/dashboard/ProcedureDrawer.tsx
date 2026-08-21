import { actionLabels, inputLabel, laneLabels, stageLabels } from "@/app/components/dashboard/constants";
import { LawApiVerifier } from "@/app/components/dashboard/LawApiVerifier";
import { StatusBadge } from "@/app/components/dashboard/StatusBadge";
import { catalog } from "@/lib/data/catalog";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import type { ScheduleResult } from "@/lib/engine/schedule";
import { formatProcessingDuration } from "@/lib/format-duration";

function citationTitle(citationId: string) {
  const citation = catalog.citations.find((item) => item.id === citationId);
  const source = catalog.legalSources.find((item) => item.id === citation?.sourceId);
  if (!citation || !source) return null;
  const locator = [citation.article, citation.paragraph, citation.subparagraph, citation.item].filter(Boolean).join(" ");
  return { citation, source, locator };
}

function durationRangeLabel(range: (typeof catalog.durations)[number]["elapsed"]) {
  if (!range) return "자료 부족";
  const unit = range.unit === "BUSINESS_DAY" ? "업무일" : range.unit === "CALENDAR_DAY" ? "달력일" : "개월";
  const values = [range.min, range.base, range.max];
  if (values.every((value) => value === null)) return "자료 부족";
  return `최소 ${range.min ?? "?"} · 통상 ${range.base ?? "?"} · 상한 ${range.max ?? "?"} ${unit}`;
}

const verificationLabels: Record<string, string> = {
  AI_ASSISTED_DRAFT: "공식자료 대조 초안",
  INTERNAL_REVIEWED: "내부 검토 완료",
  EXPERT_REVIEWED: "전문가 검토 완료",
  TODO_LEGAL_REVIEW: "법령 세부검토 필요",
};

const evidenceLabels: Record<string, string> = {
  STATUTE: "법령",
  OFFICIAL_SERVICE_STANDARD: "공식 민원처리기준",
  OFFICIAL_AGENCY_MATERIAL: "공식 기관자료",
  OBSERVED_CASE: "사례자료",
  EXPERT_ESTIMATE: "전문가 추정",
  INSUFFICIENT_DATA: "근거자료 부족",
};

const confidenceLabels: Record<string, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
  UNVERIFIED: "미검토",
};

const lagUnitLabels: Record<string, string> = {
  BUSINESS_DAY: "업무일",
  CALENDAR_DAY: "달력일",
  MONTH: "개월",
};

const citationRoleLabels: Record<string, string> = {
  APPLICABILITY: "적용조건",
  AUTHORITY: "관할·권한",
  SEQUENCE: "선후행",
  DEEMING: "인허가 의제",
  DURATION: "처리기간",
  SUBMISSION: "제출자료",
};

export function ProcedureDrawer({ decision, schedule, onClose }: {
  decision: ProcedureDecision | null;
  schedule: ScheduleResult;
  onClose: () => void;
}) {
  if (!decision) return null;
  const procedure = decision.procedure;
  const timelineNode = schedule.projectTimeline?.nodes.find((item) => item.procedureId === procedure.id);
  const duration = catalog.durations.find((item) => item.id === procedure.durationId);
  const relatedEdges = catalog.edges.filter((edge) => edge.from === procedure.id || edge.to === procedure.id);
  const decisionCitationIds = [...new Set([
    ...procedure.citationIds,
    ...decision.traces.flatMap((trace) => trace.citationIds),
    ...(decision.specialLawImpacts ?? []).flatMap((impact) => impact.citationIds),
  ])];
  const apiSources = decisionCitationIds.flatMap((citationId) => {
    const item = citationTitle(citationId);
    if (!item || !["ACT", "ENFORCEMENT_DECREE", "ENFORCEMENT_RULE"].includes(item.source.documentType)) return [];
    return [{
      id: item.source.id,
      title: item.source.title,
      mst: item.source.mst,
      article: item.citation.article,
      officialUrl: item.source.officialUrl,
    }];
  });

  return (
    <aside className="procedure-drawer" aria-label={`${procedure.name} 상세정보`}>
      <div className="drawer-header">
        <div>
          <StatusBadge status={decision.status} isDeemed={decision.isDeemed} />
          <p className="drawer-kicker">{procedure.domain} · {actionLabels[procedure.actionType]}</p>
          <h2>{procedure.name}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="상세정보 닫기">×</button>
      </div>
      <div className="drawer-body">
        <section className="reason-box">
          <span>판정 이유</span><p>{decision.reason}</p>
          {decision.missingInputs.length ? <p className="missing-inputs"><strong>추가 확인:</strong> {decision.missingInputs.map(inputLabel).join(", ")}</p> : null}
        </section>
        <dl className="detail-grid">
          <div><dt>수행 단계</dt><dd>{stageLabels[procedure.stage]}</dd></div>
          <div><dt>주관 구분</dt><dd>{laneLabels[procedure.lane]}</dd></div>
          <div><dt>접수 기관</dt><dd>{procedure.receivingAuthority}</dd></div>
          <div><dt>법정 결정권자</dt><dd>{procedure.statutoryDecisionMaker}</dd></div>
          <div><dt>신청·수행 주체</dt><dd>{procedure.applicant}</dd></div>
          <div><dt>협의 주체</dt><dd>{procedure.consultationAuthorities.length ? procedure.consultationAuthorities.join(", ") : "별도 협의 주체 없음"}</dd></div>
          <div><dt>결과물</dt><dd>{procedure.outcome}</dd></div>
          <div><dt>총 일정상 위치</dt><dd>{timelineNode ? `${timelineNode.startDate} ~ ${timelineNode.finishDate} · ${formatProcessingDuration(timelineNode.processingDuration, timelineNode.processingUnit)}${timelineNode.overlapsConstruction ? ` · 공사와 ${timelineNode.overlapWithConstructionDays}일 병행` : timelineNode.excludedFromOperationReady ? " · 가동 후 별도" : ""}` : "공사 일정 입력 필요"}</dd></div>
        </dl>
        <section className="drawer-section"><h3>절차 설명</h3><p>{procedure.description}</p></section>
        <section className="drawer-section"><h3>주요 제출자료</h3><ul>{procedure.submissions.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="drawer-section">
          <h3>선후행·병행 관계</h3>
          {relatedEdges.length ? <ul>{relatedEdges.map((edge) => {
            const otherId = edge.from === procedure.id ? edge.to : edge.from;
            const other = catalog.procedures.find((item) => item.id === otherId)?.name ?? otherId;
            const direction = edge.from === procedure.id ? "후속" : "선행";
            const relation = edge.relation === "FINISH_TO_START" ? "완료 후 시작" : edge.relation === "START_TO_START" ? "병행 시작" : "완료 연계";
            const strength = edge.strength === "LEGAL_HARD" ? "법적" : edge.strength === "PRACTICAL" ? "실무" : "권고";
            return <li key={edge.id}><strong>{direction} · {strength}</strong> — {other} ({relation}{edge.lag ? ` + ${edge.lag} ${lagUnitLabels[edge.lagUnit]}` : ""})</li>;
          })}</ul> : <p>현재 카탈로그에 직접 연결된 선후행 관계가 없습니다.</p>}
        </section>
        <section className="drawer-section duration-section">
          <h3>기간 구성과 변동요인</h3>
          {duration ? <>
            <dl className="duration-breakdown">
              <div><dt>신청인 준비</dt><dd>{durationRangeLabel(duration.applicantPreparation)}</dd></div>
              <div><dt>기관 처리</dt><dd>{durationRangeLabel(duration.authorityProcessing)}</dd></div>
              <div><dt>관계기관 협의</dt><dd>{durationRangeLabel(duration.interagencyConsultation)}</dd></div>
              <div><dt>전체 경과</dt><dd>{durationRangeLabel(duration.elapsed)}</dd></div>
            </dl>
            <p><strong>법정·공식 처리기준:</strong> {duration.statutoryPeriod ?? "확인된 공통 처리기간 없음"}</p>
            {duration.stopClockRules.length ? <p><strong>정지·보완:</strong> {duration.stopClockRules.join(" · ")}</p> : null}
            {duration.variabilityFactors.length ? <p><strong>변동요인:</strong> {duration.variabilityFactors.join(" · ")}</p> : null}
            <small>기간 근거 {evidenceLabels[duration.evidenceType] ?? duration.evidenceType} · 법적 근거 수준 {confidenceLabels[duration.legalConfidence]} · 기간자료 수준 {confidenceLabels[duration.estimateConfidence]} · 확인일 {duration.verifiedAt}</small>
          </> : <p>연결된 기간 데이터가 없습니다.</p>}
        </section>
        {decision.specialLawImpacts?.length ? (
          <section className="drawer-section special-law-impact-section">
            <h3>업종별 특례 반영</h3>
            <div className="special-law-impact-list">
              {decision.specialLawImpacts.map((impact) => (
                <article key={`${impact.lawId}-${impact.effect}`}>
                  <div><strong>{impact.effectLabel}</strong><span className={`impact-status status-${impact.status.toLowerCase()}`}>{impact.statusLabel}</span></div>
                  <p>{impact.description}</p>
                  {impact.statutoryCap ? <small><b>법정 처리상한</b> {impact.statutoryCap}</small> : null}
                  <a href={impact.officialUrl} target="_blank" rel="noreferrer">{impact.lawTitle} {impact.article} ↗</a>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {procedure.deemedByProcedureIds.length || procedure.deemedProcedureIds.length ? (
          <section className="drawer-section deeming-section">
            <h3>인허가 의제 관계</h3>
            {procedure.deemedByProcedureIds.length ? <p><strong>의제될 수 있는 상위 절차:</strong> {procedure.deemedByProcedureIds.map((id) => catalog.procedures.find((item) => item.id === id)?.name ?? id).join(", ")}</p> : null}
            {procedure.deemedProcedureIds.length ? <p><strong>의제 협의 가능 절차:</strong> {procedure.deemedProcedureIds.map((id) => catalog.procedures.find((item) => item.id === id)?.name ?? id).join(", ")}</p> : null}
            <small>의제는 신청서류 제출과 관계기관 협의를 전제로 하며 자동 승인으로 보지 않습니다.</small>
          </section>
        ) : null}
        <section className="drawer-section">
          <div className="section-heading-row"><h3>공식 근거</h3><span>{decisionCitationIds.length}건</span></div>
          <div className="citation-list">
            {decisionCitationIds.map((citationId) => {
              const item = citationTitle(citationId);
              if (!item) return null;
              return (
                <a key={citationId} href={item.source.officialUrl} target="_blank" rel="noreferrer" className="citation-card">
                  <span>{item.source.title}</span><strong>{item.locator || citationRoleLabels[item.citation.role]}</strong><p>{item.citation.summary}</p>
                  <small>{item.citation.sourceVersion} · 시행 {item.source.effectiveDate ?? "추가 확인"} · 검증 {item.source.internallyVerifiedAt} · 원문 열기 ↗</small>
                </a>
              );
            })}
            {!decisionCitationIds.length ? <div className="citation-empty">공식 공급기관 기준을 아직 수집하지 않아 확정 근거로 표시하지 않습니다.</div> : null}
          </div>
          <LawApiVerifier sources={apiSources} />
        </section>
        <section className="review-note">
          <strong>자료 확인 상태 · {verificationLabels[procedure.verificationStatus] ?? procedure.verificationStatus}</strong><p>{procedure.reviewNote}</p>
          {decision.needsLegalReview ? <p><strong>추가 법률검토:</strong> {decision.legalReviewReasons.join(" · ")}</p> : null}
          <small>검토일 {procedure.reviewedAt} · 데이터 {decision.dataVersion}</small>
        </section>
      </div>
    </aside>
  );
}
