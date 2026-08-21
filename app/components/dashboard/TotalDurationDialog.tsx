"use client";

import { useEffect, useMemo, useRef } from "react";

import { stageLabels } from "@/app/components/dashboard/constants";
import { catalog } from "@/lib/data/catalog";
import type { ScheduleResult } from "@/lib/engine/schedule";
import { formatCalendarPeriod } from "@/lib/format-duration";

const procedureNames = new Map(
  catalog.procedures.map((procedure) => [procedure.id, procedure.name]),
);
const procedureStages = new Map(
  catalog.procedures.map((procedure) => [procedure.id, procedure.stage]),
);

export function TotalDurationDialog({
  schedule,
  onClose,
}: {
  schedule: ScheduleResult;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timeline = schedule.projectTimeline;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    headingRef.current?.focus();
    return () => {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
    };
  }, []);

  const groups = useMemo(() => {
    if (!timeline) return [];
    return Object.entries(stageLabels).map(([stage, label]) => ({
      stage,
      label,
      nodes: timeline.nodes
        .filter((node) => procedureStages.get(node.procedureId) === stage)
        .sort(
          (left, right) =>
            left.startOffsetDays - right.startOffsetDays ||
            left.finishOffsetDays - right.finishOffsetDays ||
            left.procedureId.localeCompare(right.procedureId),
        ),
    }));
  }, [timeline]);

  const completionDate = timeline
    ? timeline.operationReadyDate ?? timeline.minimumKnownCompletionDate
    : null;
  const unknownActiveCount = timeline
    ? timeline.unknownPlanningDurationProcedureIds.filter(
        (id) => !timeline.postOperationProcedureIds.includes(id),
      ).length
    : 0;

  return (
    <dialog
      ref={dialogRef}
      id="total-duration-dialog"
      className="status-summary-dialog duration-flow-dialog"
      aria-modal="true"
      aria-labelledby="total-duration-dialog-title"
      aria-describedby="total-duration-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="status-dialog-panel duration-flow-panel">
        <header>
          <div>
            <span>사업 전체 일정</span>
            <h2 id="total-duration-dialog-title" ref={headingRef} tabIndex={-1}>
              총 소요기간 계산 경로
            </h2>
            <p id="total-duration-dialog-description">
              착공 전 인허가, 공사와 병행하는 절차, 준공·가동 준비 절차를 6단계로 묶었습니다.
            </p>
          </div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="총 소요기간 닫기">×</button>
        </header>

        {!timeline ? (
          <div className="duration-flow-empty">
            <strong>공사 시작일과 준공일을 입력해 주세요.</strong>
            <span>두 날짜가 입력되면 인허가 선행기간과 공사기간을 합쳐 총 소요기간을 계산합니다.</span>
          </div>
        ) : (
          <div className="duration-flow-body">
            <section className="duration-route-summary" aria-label="총 소요기간 주요 구간">
              <div><span>검토 시작</span><strong>{timeline.projectStartDate}</strong></div>
              <i aria-hidden="true">→</i>
              <div><span>착공 전 인허가</span><strong>{timeline.permitLeadCalendarDays ?? timeline.plannedPreConstructionCalendarDays}일</strong></div>
              <i aria-hidden="true">→</i>
              <div><span>건설공사</span><strong>{formatCalendarPeriod(timeline.plannedConstructionStartDate, timeline.plannedConstructionEndDate)}</strong></div>
              <i aria-hidden="true">→</i>
              <div><span>가동 준비 완료</span><strong>{completionDate}</strong></div>
            </section>

            <div className={`duration-result-note ${timeline.durationStatus === "MINIMUM_ONLY" ? "has-gap" : ""}`} role="note">
              <strong>{formatCalendarPeriod(timeline.projectStartDate, completionDate!)}</strong>
              <span>
                {timeline.durationStatus === "MINIMUM_ONLY"
                  ? `현재 공식 처리기간이 확인된 절차를 기준으로 합산했습니다. 기간 미확인 ${unknownActiveCount}개는 숫자에 포함되지 않습니다.`
                  : schedule.scenario === "MIN"
                    ? "각 절차의 확인된 최소 처리기간을 적용했습니다."
                    : "각 절차의 확인된 통상 처리기간을 적용했습니다."}
              </span>
            </div>

            <ol className="duration-stage-flow" aria-label="전체 절차 6단계 그래픽">
              {groups.map((group, index) => (
                <li key={group.stage}>
                  <header><span>{index + 1}</span><strong>{group.label}</strong><small>{group.nodes.length}개</small></header>
                  <div className="duration-procedure-chips">
                    {group.nodes.map((node) => (
                      <span
                        key={node.procedureId}
                        data-procedure-id={node.procedureId}
                        className={[
                          node.excludedFromOperationReady ? "is-post-operation" : "",
                          node.processingDuration === null ? "is-unknown" : "",
                          node.extendsOperationReady ? "is-extending" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        <b>{procedureNames.get(node.procedureId) ?? node.procedureId}</b>
                        {node.excludedFromOperationReady
                          ? <small>가동 후 별도</small>
                          : node.processingDuration === null
                            ? <small>기간 확인 필요</small>
                            : node.extendsOperationReady
                              ? <small>총기간 연장</small>
                              : node.overlapsConstruction
                                ? <small>공사와 병행</small>
                                : null}
                      </span>
                    ))}
                    {!group.nodes.length ? <em>현재 포함된 절차 없음</em> : null}
                  </div>
                </li>
              ))}
            </ol>

            <p className="duration-flow-legend">
              같은 단계의 절차는 병렬 진행이 가능할 수 있으며, 실제 착수일은 선행절차·보완요구·관계기관 협의에 따라 달라집니다.
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
}
