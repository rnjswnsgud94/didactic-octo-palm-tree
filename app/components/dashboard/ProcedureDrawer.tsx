import { actionLabels, laneLabels, stageLabels } from "@/app/components/dashboard/constants";
import { StatusBadge } from "@/app/components/dashboard/StatusBadge";
import { catalog } from "@/lib/data/catalog";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import type { ScheduleResult } from "@/lib/engine/schedule";

function citationTitle(citationId: string) {
  const citation = catalog.citations.find((item) => item.id === citationId);
  const source = catalog.legalSources.find((item) => item.id === citation?.sourceId);
  if (!citation || !source) return null;
  const locator = [citation.article, citation.paragraph, citation.subparagraph, citation.item].filter(Boolean).join(" ");
  return { citation, source, locator };
}

function durationRangeLabel(range: (typeof catalog.durations)[number]["elapsed"]) {
  if (!range) return "자료 부족";
  const unit = range.unit === "BUSINESS_DAY" ? "영업일" : range.unit === "CALENDAR_DAY" ? "달력일" : "개월";
  const values = [range.min, range.base, range.max];
  if (values.every((value) => value === null)) return "자료 부족";
  return `최소 ${range.min ?? "?"} · 기준 ${range.base ?? "?"} · 최대 ${range.max ?? "?"} ${unit}`;
}

export function ProcedureDrawer({ decision, schedule, onClose }: {
  decision: ProcedureDecision | null;
  schedule: ScheduleResult;
  onClose: () => void;
}) {
  if (!decision) return null;
  const procedure = decision.procedure;
  const node = schedule.nodes.find((item) => item.procedureId === procedure.id);
  const duration = catalog.durations.find((item) => item.id === procedure.durationId);
  const relatedEdges = catalog.edges.filter((edge) => edge.from === procedure.id || edge.to === procedure.id);

  return (
    <aside className="procedure-drawer" aria-label={`${procedure.name} 상세정보`}>
      <div className="drawer-header">
        <div>
          <StatusBadge status={decision.status} />
          <p className="drawer-kicker">{procedure.domain} · {actionLabels[procedure.actionType]}</p>
          <h2>{procedure.name}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="상세정보 닫기">×</button>
      </div>
      <div className="drawer-body">
        <section className="reason-box">
          <span>판정 이유</span><p>{decision.reason}</p>
          {decision.missingInputs.length ? <p className="missing-inputs"><strong>추가 확인:</strong> {decision.missingInputs.join(", ")}</p> : null}
        </section>
        <dl className="detail-grid">
          <div><dt>수행 단계</dt><dd>{stageLabels[procedure.stage]}</dd></div>
          <div><dt>담당 레인</dt><dd>{laneLabels[procedure.lane]}</dd></div>
          <div><dt>접수 기관</dt><dd>{procedure.receivingAuthority}</dd></div>
          <div><dt>법정 결정권자</dt><dd>{procedure.statutoryDecisionMaker}</dd></div>
          <div><dt>신청·수행 주체</dt><dd>{procedure.applicant}</dd></div>
          <div><dt>협의 주체</dt><dd>{procedure.consultationAuthorities.length ? procedure.consultationAuthorities.join(", ") : "별도 협의 주체 없음"}</dd></div>
          <div><dt>결과물</dt><dd>{procedure.outcome}</dd></div>
          <div><dt>부분 일정</dt><dd>{node?.duration === null || !node ? "자료 없음" : `${node.duration} 영업일`}{node?.critical ? " · 임계경로" : ""}</dd></div>
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
            return <li key={edge.id}><strong>{direction} · {strength}</strong> — {other} ({relation}{edge.lag ? ` + ${edge.lag} ${edge.lagUnit}` : ""})</li>;
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
            <small>근거 {duration.evidenceType.replaceAll("_", " ")} · 법적 신뢰도 {duration.legalConfidence} · 기간 신뢰도 {duration.estimateConfidence} · 검증일 {duration.verifiedAt}</small>
          </> : <p>연결된 기간 데이터가 없습니다.</p>}
        </section>
        {procedure.deemedByProcedureIds.length || procedure.deemedProcedureIds.length ? (
          <section className="drawer-section deeming-section">
            <h3>인허가 의제 관계</h3>
            {procedure.deemedByProcedureIds.length ? <p><strong>의제될 수 있는 상위 절차:</strong> {procedure.deemedByProcedureIds.map((id) => catalog.procedures.find((item) => item.id === id)?.name ?? id).join(", ")}</p> : null}
            {procedure.deemedProcedureIds.length ? <p><strong>의제 협의 가능 절차:</strong> {procedure.deemedProcedureIds.map((id) => catalog.procedures.find((item) => item.id === id)?.name ?? id).join(", ")}</p> : null}
            <small>의제는 신청서류 제출과 관계기관 협의를 전제로 하며 자동 승인으로 보지 않습니다.</small>
          </section>
        ) : null}
        <section className="drawer-section">
          <div className="section-heading-row"><h3>공식 근거</h3><span>{procedure.citationIds.length}건</span></div>
          <div className="citation-list">
            {procedure.citationIds.map((citationId) => {
              const item = citationTitle(citationId);
              if (!item) return null;
              return (
                <a key={citationId} href={item.source.officialUrl} target="_blank" rel="noreferrer" className="citation-card">
                  <span>{item.source.title}</span><strong>{item.locator || item.citation.role}</strong><p>{item.citation.summary}</p>
                  <small>{item.citation.sourceVersion} · 시행 {item.source.effectiveDate ?? "추가 확인"} · 검증 {item.source.internallyVerifiedAt} · 원문 열기 ↗</small>
                </a>
              );
            })}
            {!procedure.citationIds.length ? <div className="citation-empty">공식 공급기관 기준을 아직 수집하지 않아 확정 근거로 표시하지 않습니다.</div> : null}
          </div>
        </section>
        <section className="review-note">
          <strong>검증 상태 · {procedure.verificationStatus.replaceAll("_", " ")}</strong><p>{procedure.reviewNote}</p>
          <small>검토일 {procedure.reviewedAt} · 데이터 {decision.dataVersion}</small>
        </section>
      </div>
    </aside>
  );
}
