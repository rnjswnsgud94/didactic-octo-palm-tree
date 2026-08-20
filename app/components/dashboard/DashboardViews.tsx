import { inputLabel, stageLabels } from "@/app/components/dashboard/constants";
import { StatusBadge } from "@/app/components/dashboard/StatusBadge";
import { catalog } from "@/lib/data/catalog";
import { planningDurationNotice } from "@/lib/data/planning-durations";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import type { ScheduleResult } from "@/lib/engine/schedule";
import { formatCalendarPeriod, formatProcessingDuration } from "@/lib/format-duration";

const planningConfidenceLabels = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
  UNVERIFIED: "미검토",
} as const;

const documentTypeLabels: Record<(typeof catalog.legalSources)[number]["documentType"], string> = {
  ACT: "법률",
  ENFORCEMENT_DECREE: "시행령",
  ENFORCEMENT_RULE: "시행규칙",
  ADMINISTRATIVE_RULE: "행정규칙",
  NOTICE: "고시",
  LOCAL_ORDINANCE: "자치법규",
  INDUSTRIAL_COMPLEX_PLAN: "산업단지 관리계획",
  OFFICIAL_SERVICE_GUIDE: "공식 민원안내",
};

const sourceStatusLabels: Record<(typeof catalog.legalSources)[number]["status"], string> = {
  AUTHORITATIVE: "공식 원문 확인",
  STALE: "재검토 필요",
  UNVERIFIED: "원문 미검증",
};

const citationRoleLabels: Record<(typeof catalog.citations)[number]["role"], string> = {
  APPLICABILITY: "적용조건",
  AUTHORITY: "관할·권한",
  SEQUENCE: "선후행",
  DEEMING: "인허가 의제",
  DURATION: "처리기간",
  SUBMISSION: "제출자료",
};

export function ProcedureList({ decisions, schedule, onSelect }: {
  decisions: ProcedureDecision[];
  schedule: ScheduleResult;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-shell">
      <table className="procedure-table">
        <thead><tr><th>판정</th><th>절차</th><th>단계</th><th>접수 기관</th><th>공식 처리기간</th><th>일정 반영</th><th><span className="sr-only">상세</span></th></tr></thead>
        <tbody>
          {decisions.map((decision) => {
            const node = schedule.nodes.find((item) => item.procedureId === decision.procedure.id);
            const timelineNode = schedule.projectTimeline?.nodes.find((item) => item.procedureId === decision.procedure.id);
            return (
              <tr key={decision.procedure.id}>
                <td><StatusBadge status={decision.status} /></td>
                <td><strong>{decision.procedure.name}</strong><small>{decision.procedure.domain}</small></td>
                <td>{stageLabels[decision.procedure.stage]}</td>
                <td>{decision.procedure.receivingAuthority}</td>
                <td>{!timelineNode ? "일정 제외" : `${formatProcessingDuration(timelineNode.processingDuration, timelineNode.processingUnit)} · 근거수준 ${planningConfidenceLabels[timelineNode.durationConfidence]}`}</td>
                <td>{!timelineNode ? "일정 제외" : timelineNode.excludedFromOperationReady ? "가동 후 별도" : timelineNode.overlapsConstruction && !timelineNode.extendsOperationReady ? `공사 중 흡수(${timelineNode.overlapWithConstructionDays}일)` : timelineNode.extendsOperationReady ? "준공 뒤 연장" : node?.parallel ? "병렬 진행" : "순차 진행"}</td>
                <td><button type="button" className="text-button" onClick={() => onSelect(decision.procedure.id)}>보기</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!decisions.length ? <div className="empty-state">현재 필터와 일치하는 절차가 없습니다.</div> : null}
    </div>
  );
}

export function ScheduleView({ schedule }: { schedule: ScheduleResult }) {
  const names = new Map(catalog.procedures.map((item) => [item.id, item.name]));
  const timeline = schedule.projectTimeline;
  if (!timeline) {
    return (
      <div className="schedule-layout">
        <div className="empty-state schedule-empty-state">
          <strong>공사 시작일과 준공일을 입력해 주세요.</strong>
          <span>공사 일정이 있어야 공식 처리기간, 공사기간, 병행 가능한 절차를 한 일정으로 계산할 수 있습니다.</span>
        </div>
      </div>
    );
  }

  const activeNodes = timeline.nodes.filter((node) => !node.excludedFromOperationReady);
  const postNodes = timeline.nodes.filter((node) => node.excludedFromOperationReady);
  const timedActiveNodes = activeNodes.filter((node) => node.processingDuration !== null);
  const absorbedNodes = timedActiveNodes.filter(
    (node) => node.overlapsConstruction && !node.extendsOperationReady,
  );
  const extendingNodes = timedActiveNodes.filter((node) => node.extendsOperationReady);
  const unknownActiveNodes = activeNodes.filter((node) => node.processingDuration === null);
  const denominator = timeline.displayHorizonDays;
  const dayIndex = (value: string) =>
    Math.floor(new Date(value + "T00:00:00.000Z").getTime() / 86_400_000);
  const displayedConstructionStart =
    timeline.adjustedConstructionStartDate ?? timeline.plannedConstructionStartDate;
  const displayedConstructionEnd =
    timeline.constructionCompletionDate ?? timeline.plannedConstructionEndDate;
  const constructionStartOffset = Math.max(
    0,
    dayIndex(displayedConstructionStart) - dayIndex(timeline.projectStartDate),
  );
  const constructionDays =
    dayIndex(displayedConstructionEnd) - dayIndex(displayedConstructionStart) + 1;
  const constructionWidth = Math.max((constructionDays / denominator) * 100, 1.5);
  const completionDate = timeline.operationReadyDate ?? timeline.minimumKnownCompletionDate;
  const totalDuration = formatCalendarPeriod(timeline.projectStartDate, completionDate);
  const statusTitle =
    timeline.durationStatus === "MINIMUM_ONLY"
      ? "공식 처리기간이 확인된 절차만 합산한 결과입니다."
      : timeline.durationStatus === "CONDITIONAL_INCLUDED"
        ? "적용 여부를 확인할 절차까지 포함했습니다."
        : schedule.scenario === "MIN"
          ? "확인된 공식 최단 처리경로입니다."
          : "확인된 공식 표준 처리경로입니다.";

  return (
    <div className="schedule-layout">
      <div className="schedule-summary">
        <div>
          <span>총 소요기간</span>
          <strong>{totalDuration}<small>{timeline.durationStatus === "MINIMUM_ONLY" ? " · 확인된 처리기간 기준 · 기간 미확인 " + unknownActiveNodes.length + "개 별도" : schedule.scenario === "MIN" ? " · 최소기간" : " · 통상"}</small></strong>
        </div>
        <div>
          <span>{timeline.permitLeadCalendarDays === null ? "계획상 착공 준비" : "착공 전 인허가"}</span>
          <strong>{timeline.permitLeadCalendarDays ?? timeline.plannedPreConstructionCalendarDays}<small>일</small></strong>
        </div>
        <div><span>공사기간</span><strong>{formatCalendarPeriod(timeline.plannedConstructionStartDate, timeline.plannedConstructionEndDate)}<small> · {timeline.constructionCalendarDays}일</small></strong></div>
        <div><span>공사 중 병행</span><strong>{timeline.durationStatus === "MINIMUM_ONLY" ? "확인 범위" : timeline.absorbedByConstructionCalendarDays}<small>{timeline.durationStatus === "MINIMUM_ONLY" ? " " + absorbedNodes.length + "개 절차" : "일"}</small></strong></div>
      </div>
      <div className="schedule-coverage" aria-label="절차 기간 반영 현황">
        <div><span>가동 준비 경로</span><strong>{activeNodes.length}</strong><small>개 절차</small></div>
        <div><span>기간 근거 있음</span><strong>{timedActiveNodes.length}</strong><small>개 절차</small></div>
        <div><span>공사 중 완료</span><strong>{absorbedNodes.length}</strong><small>개 절차</small></div>
        <div><span>준공 뒤 연장</span><strong>{extendingNodes.length}</strong><small>개 절차</small></div>
        <div className={unknownActiveNodes.length ? "has-gap" : ""}><span>기간 근거 없음</span><strong>{unknownActiveNodes.length}</strong><small>개 절차</small></div>
        <div><span>가동 후 별도</span><strong>{postNodes.length}</strong><small>개 절차</small></div>
      </div>
      <div className="timeline-milestones" aria-label="주요 일정">
        <div><span>검토 시작</span><strong>{timeline.projectStartDate}</strong></div>
        <div><span>계획 착공</span><strong>{timeline.plannedConstructionStartDate}</strong></div>
        <div><span>계획 준공</span><strong>{timeline.plannedConstructionEndDate}</strong><small>사용자 입력</small></div>
        <div className={timeline.constructionDelayCalendarDays ? "is-delayed" : ""}>
          <span>인허가 반영 착공·준공</span>
          <strong>{timeline.adjustedConstructionStartDate && timeline.constructionCompletionDate ? timeline.adjustedConstructionStartDate + " ~ " + timeline.constructionCompletionDate : "기간 근거 확인 필요"}</strong>
          {timeline.constructionDelayCalendarDays ? <small>{timeline.constructionDelayCalendarDays}일 순연</small> : timeline.constructionDelayCalendarDays === 0 ? <small>계획대로</small> : <small>미확인 절차 있음</small>}
        </div>
        <div><span>가동 준비 완료</span><strong>{timeline.operationReadyDate ?? "기간 근거 확인 필요"}</strong>{timeline.operationReadyDate ? null : <small>확인된 경계 {timeline.minimumKnownCompletionDate}</small>}</div>
      </div>
      <div className="schedule-warning" role="note"><strong>{statusTitle}</strong><span>{planningDurationNotice}</span></div>
      <div className="gantt-shell" aria-label="인허가와 공사를 합친 날짜별 일정">
        <div className="gantt-scale"><span>{timeline.projectStartDate}</span><span>중간</span><span>{completionDate}</span></div>
        <div className="gantt-row construction-gantt-row">
          <div className="gantt-label"><strong>공장 건설공사</strong><span>{displayedConstructionStart} ~ {displayedConstructionEnd} · {timeline.constructionCalendarDays}일</span></div>
          <div className="gantt-track"><span className="gantt-bar is-construction" style={{ left: (constructionStartOffset / denominator) * 100 + "%", width: Math.min(constructionWidth, Math.max(1.5, 100 - (constructionStartOffset / denominator) * 100)) + "%" }} /></div>
        </div>
        {activeNodes.map((node) => {
          const left = (node.startOffsetDays / denominator) * 100;
          const durationDays = Math.max(0, node.finishOffsetDays - node.startOffsetDays);
          const width = Math.max((durationDays / denominator) * 100, 1.2);
          return (
            <div className="gantt-row" key={node.procedureId}>
              <div className="gantt-label">
                <strong>{names.get(node.procedureId)}</strong>
                <span>{formatProcessingDuration(node.processingDuration, node.processingUnit)} · {node.startDate} ~ {node.finishDate}{node.overlapsConstruction ? " · 공사와 " + node.overlapWithConstructionDays + "일 병행" : ""}</span>
              </div>
              <div className="gantt-track"><span className={"gantt-bar " + (node.extendsOperationReady ? "is-critical " : "") + (node.overlapsConstruction ? "is-overlap " : "") + (node.processingDuration === null ? "is-unknown" : "")} style={{ left: left + "%", width: Math.min(width, Math.max(1.2, 100 - left)) + "%" }} /></div>
            </div>
          );
        })}
      </div>
      {postNodes.length ? (
        <section className="post-operation-list">
          <h3>가동 후 별도 관리</h3>
          <p>아래 절차는 가동 준비 완료일과 총 소요기간에 넣지 않았습니다.</p>
          <ul>{postNodes.map((node) => <li key={node.procedureId}><strong>{names.get(node.procedureId)}</strong><span>{formatProcessingDuration(node.processingDuration, node.processingUnit)} · {node.startDate}부터</span></li>)}</ul>
        </section>
      ) : null}
      <div className="warning-list">{timeline.warnings.map((warning) => <p key={warning}>※ {warning}</p>)}</div>
    </div>
  );
}

export function LegalView({ decisions, onSelect }: { decisions: ProcedureDecision[]; onSelect: (id: string) => void }) {
  const relevantCitationIds = new Set(decisions.flatMap((decision) => decision.procedure.citationIds));
  const relevantSourceIds = new Set(catalog.citations.filter((citation) => relevantCitationIds.has(citation.id)).map((citation) => citation.sourceId));
  return (
    <div className="legal-grid">
      {catalog.legalSources.filter((source) => relevantSourceIds.has(source.id)).map((source) => {
        const sourceCitations = catalog.citations.filter((citation) => citation.sourceId === source.id && relevantCitationIds.has(citation.id));
        const linked = decisions.filter((decision) => decision.procedure.citationIds.some((id) => sourceCitations.some((citation) => citation.id === id)));
        return (
          <article className="source-card" key={source.id}>
            <div className="source-card-topline"><span>{documentTypeLabels[source.documentType]}</span><em className={`source-status source-${source.status.toLowerCase()}`}>{sourceStatusLabels[source.status]}</em></div>
            <h3>{source.title}</h3><p>{source.issuingAuthority} · {source.effectiveDate ? `시행 ${source.effectiveDate}` : "시행일 추가 확인"}</p>
            <ul>{sourceCitations.map((citation) => <li key={citation.id}><strong>{[citation.article, citation.paragraph].filter(Boolean).join(" ") || citationRoleLabels[citation.role]}</strong><span>{citation.summary}</span></li>)}</ul>
            <div className="source-card-actions"><a href={source.officialUrl} target="_blank" rel="noreferrer">공식 원문 ↗</a>{linked.slice(0, 2).map((decision) => <button key={decision.procedure.id} type="button" onClick={() => onSelect(decision.procedure.id)}>{decision.procedure.name}</button>)}</div>
          </article>
        );
      })}
    </div>
  );
}

export function GapsView({ decisions }: { decisions: ProcedureDecision[] }) {
  const missing = [...new Set(decisions.flatMap((decision) => decision.missingInputs))].sort();
  return (
    <div className="gaps-layout">
      <section className="gap-section priority-gap"><span className="eyebrow">입력 확인</span><h3>판정에 필요한 추가 정보</h3>{missing.length ? <ul>{missing.map((item) => <li key={item}>{inputLabel(item)}</li>)}</ul> : <p>현재 수록된 판정규칙에 필요한 입력값은 모두 채워졌습니다. 필지별 규제와 지역기준은 별도로 확인해야 합니다.</p>}</section>
      <section className="gap-section"><span className="eyebrow">검토 범위</span><h3>현재 데이터에 포함되지 않은 항목</h3><ul>{catalog.coverage.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></section>
      <section className="gap-section future-gap"><span className="eyebrow">법령 점검</span><h3>다음 확인 예정사항</h3><ul>{catalog.coverage.futureLawWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>
    </div>
  );
}
