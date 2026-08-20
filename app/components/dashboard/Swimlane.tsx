"use client";

import { useState } from "react";

import { laneLabels, stageLabels } from "@/app/components/dashboard/constants";
import { StatusBadge } from "@/app/components/dashboard/StatusBadge";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import type { ScheduleResult } from "@/lib/engine/schedule";

const stages = Object.keys(stageLabels) as Array<keyof typeof stageLabels>;
const lanes = Object.keys(laneLabels) as Array<keyof typeof laneLabels>;

function durationLabel(decision: ProcedureDecision, schedule: ScheduleResult) {
  const node = schedule.nodes.find((item) => item.procedureId === decision.procedure.id);
  if (!node || node.duration === null) return "기간 자료 없음";
  return `${node.duration} 영업일`;
}

export function Swimlane({ decisions, schedule, selectedId, onSelect }: {
  decisions: ProcedureDecision[];
  schedule: ScheduleResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [collapsedLanes, setCollapsedLanes] = useState<string[]>([]);
  const usedLanes = lanes.filter((lane) => decisions.some((decision) => decision.procedure.lane === lane));

  function toggleLane(lane: string) {
    setCollapsedLanes((current) => current.includes(lane) ? current.filter((item) => item !== lane) : [...current, lane]);
  }

  return (
    <section className="swimlane-shell" aria-label="기관별 인허가 스윔레인">
      <div className="swimlane-legend" aria-label="표시 범례">
        <span><i className="legend-line hard" /> 법적 선행</span>
        <span><i className="legend-line practical" /> 실무 선행 반영</span>
        <span><i className="legend-critical" /> 부분 임계경로</span>
      </div>
      <div className="swimlane-scroll" tabIndex={0} aria-label="가로로 스크롤할 수 있는 인허가 표">
        <div className="swimlane-grid" style={{ gridTemplateColumns: `168px repeat(${stages.length}, minmax(176px, 1fr))` }}>
          <div className="swimlane-corner">담당 기관 / 단계</div>
          {stages.map((stage, index) => <div className="stage-header" key={stage}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stageLabels[stage]}</strong></div>)}
          {usedLanes.map((lane) => (
            <div className={`swimlane-row ${collapsedLanes.includes(lane) ? "is-collapsed" : ""}`} key={lane}>
              <button type="button" className="lane-header" aria-expanded={!collapsedLanes.includes(lane)} onClick={() => toggleLane(lane)}>
                <span className="lane-marker" aria-hidden="true" /><strong>{laneLabels[lane]}</strong><span className="lane-toggle" aria-hidden="true">{collapsedLanes.includes(lane) ? "+" : "−"}</span>
              </button>
              {stages.map((stage) => {
                const cells = decisions.filter((decision) => decision.procedure.lane === lane && decision.procedure.stage === stage);
                return (
                  <div className="lane-cell" key={`${lane}-${stage}`} aria-hidden={collapsedLanes.includes(lane)}>
                    {cells.map((decision) => {
                      const isCritical = schedule.criticalProcedureIds.includes(decision.procedure.id);
                      return (
                        <button type="button" key={decision.procedure.id}
                          className={`procedure-card status-card-${decision.status.toLowerCase()} ${isCritical ? "is-critical" : ""} ${selectedId === decision.procedure.id ? "is-selected" : ""}`}
                          aria-pressed={selectedId === decision.procedure.id}
                          onClick={() => onSelect(decision.procedure.id)}>
                          <span className="procedure-card-topline"><StatusBadge status={decision.status} compact /><span>{decision.procedure.domain}</span></span>
                          <strong>{decision.procedure.name}</strong>
                          <span className="procedure-meta">{durationLabel(decision, schedule)}{isCritical ? <em>임계</em> : null}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="panel-footnote">선행관계는 일정 탭의 계산에 반영됩니다. 카드를 선택하면 판정 이유와 원문 근거를 확인할 수 있습니다.</p>
    </section>
  );
}
