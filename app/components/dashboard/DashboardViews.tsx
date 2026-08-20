import { stageLabels } from "@/app/components/dashboard/constants";
import { StatusBadge } from "@/app/components/dashboard/StatusBadge";
import { catalog } from "@/lib/data/catalog";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import type { ScheduleResult } from "@/lib/engine/schedule";

export function ProcedureList({ decisions, schedule, onSelect }: {
  decisions: ProcedureDecision[];
  schedule: ScheduleResult;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-shell">
      <table className="procedure-table">
        <thead><tr><th>판정</th><th>절차</th><th>단계</th><th>접수 기관</th><th>기간</th><th><span className="sr-only">상세</span></th></tr></thead>
        <tbody>
          {decisions.map((decision) => {
            const node = schedule.nodes.find((item) => item.procedureId === decision.procedure.id);
            return (
              <tr key={decision.procedure.id}>
                <td><StatusBadge status={decision.status} /></td>
                <td><strong>{decision.procedure.name}</strong><small>{decision.procedure.domain}</small></td>
                <td>{stageLabels[decision.procedure.stage]}</td>
                <td>{decision.procedure.receivingAuthority}</td>
                <td>{node?.duration === null || !node ? "자료 없음" : `${node.duration}일`}{node?.critical ? <em className="critical-text"> 임계</em> : null}</td>
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
  const denominator = Math.max(schedule.total, 1);
  return (
    <div className="schedule-layout">
      <div className="schedule-summary">
        <div><span>부분 일정</span><strong>{schedule.total} <small>영업일</small></strong></div>
        <div><span>계산 절차</span><strong>{schedule.nodes.length} <small>개</small></strong></div>
        <div><span>기간 미확인</span><strong>{schedule.unknownDurationProcedureIds.length} <small>개</small></strong></div>
        <div><span>계산 상태</span><strong className={schedule.complete ? "good-text" : "warning-text"}>{schedule.complete ? "완전" : "부분"}</strong></div>
      </div>
      <div className="schedule-warning" role="note"><strong>총 사업기간이 아닙니다.</strong><span>현재 데이터가 있는 행정처리기간과 선행관계만으로 계산한 부분 일정입니다. 공사기간·보완기간·공휴일은 제외됩니다.</span></div>
      <div className="gantt-shell" aria-label="절차별 부분 일정 막대 차트">
        <div className="gantt-scale"><span>0일</span><span>{Math.round(schedule.total / 2)}일</span><span>{schedule.total}일</span></div>
        {schedule.nodes.map((node) => {
          const left = (node.earliestStart / denominator) * 100;
          const width = Math.max((Math.max(node.duration ?? 0, 0.8) / denominator) * 100, 1.2);
          return (
            <div className="gantt-row" key={node.procedureId}>
              <div className="gantt-label"><strong>{names.get(node.procedureId)}</strong><span>{node.duration === null ? "기간 미확인" : `${node.duration} 영업일`}</span></div>
              <div className="gantt-track"><span className={`gantt-bar ${node.critical ? "is-critical" : ""} ${node.duration === null ? "is-unknown" : ""}`} style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div className="warning-list">{schedule.warnings.map((warning) => <p key={warning}>※ {warning}</p>)}</div>
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
            <div className="source-card-topline"><span>{source.documentType.replaceAll("_", " ")}</span><em className={`source-status source-${source.status.toLowerCase()}`}>{source.status}</em></div>
            <h3>{source.title}</h3><p>{source.issuingAuthority} · {source.effectiveDate ? `시행 ${source.effectiveDate}` : "시행일 추가 확인"}</p>
            <ul>{sourceCitations.map((citation) => <li key={citation.id}><strong>{[citation.article, citation.paragraph].filter(Boolean).join(" ") || citation.role}</strong><span>{citation.summary}</span></li>)}</ul>
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
      <section className="gap-section priority-gap"><span className="eyebrow">ACTION REQUIRED</span><h3>현재 시나리오의 추가 확인사항</h3>{missing.length ? <ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul> : <p>자동판정 규칙에 필요한 입력값은 모두 채워졌습니다. 다만 범위 밖 세부법령 검토는 별도입니다.</p>}</section>
      <section className="gap-section"><span className="eyebrow">COVERAGE</span><h3>MVP 자동판정 범위 밖</h3><ul>{catalog.coverage.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></section>
      <section className="gap-section future-gap"><span className="eyebrow">REVIEW WATCH</span><h3>시행예정·재검증 알림</h3><ul>{catalog.coverage.futureLawWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>
    </div>
  );
}
