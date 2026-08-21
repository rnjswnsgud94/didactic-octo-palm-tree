"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  isInputMatchedRoadmapInclusion,
  laneLabels,
  stageLabels,
} from "@/app/components/dashboard/constants";
import {
  createObstacleAvoidingConnectorRouter,
  orthogonalConnectorPath,
  type CardRect,
} from "@/app/components/dashboard/connector-routing";
import { StatusBadge } from "@/app/components/dashboard/StatusBadge";
import { catalog } from "@/lib/data/catalog";
import type { ProcedureEdge } from "@/lib/domain/schemas";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import type { ProjectTimelineNode, ScheduleResult } from "@/lib/engine/schedule";
import { formatProcessingDuration } from "@/lib/format-duration";

const lanes = Object.keys(laneLabels) as Array<keyof typeof laneLabels>;
export const denseProcedureColumnThreshold = 10;
export { orthogonalConnectorPath };

type ConnectorPath = {
  id: string;
  path: string;
  strength: ProcedureEdge["strength"];
  contextual: boolean;
  selected: boolean;
};

type ConnectorLayout = {
  width: number;
  height: number;
  paths: ConnectorPath[];
};

const emptyConnectorLayout: ConnectorLayout = {
  width: 0,
  height: 0,
  paths: [],
};


function planningLabel(node: ProjectTimelineNode | undefined) {
  if (!node) return "일정 제외";
  const duration = formatProcessingDuration(node.processingDuration, node.processingUnit);
  if (node.excludedFromOperationReady) return `가동 후 별도 · ${duration}`;
  if (node.overlapsConstruction) {
    return `${duration} · 공사와 ${node.overlapWithConstructionDays}일 병행`;
  }
  return duration;
}

function dateText(value: string | undefined) {
  if (!value) return "일정 미입력";
  return value.replaceAll("-", ".");
}

const stageGroupTitles: Record<keyof typeof stageLabels, string> = {
  SITE_REVIEW: "입지·사업성 검토",
  PLAN_AND_OCCUPANCY: "사업계획·입주 승인",
  PRE_CONSTRUCTION: "착공 전 승인·신고",
  DURING_CONSTRUCTION: "공사 병행 점검",
  PRE_OPERATION: "준공·가동 승인",
  POST_OPERATION: "가동 후 등록·관리",
};

function flowGroupTitle(decisions: ProcedureDecision[]) {
  const names = decisions.map((decision) => decision.procedure.name).join(" ");
  if (/사용승인|완료신고|완성검사|준공/.test(names)) return "준공·완성검사";
  if (/착공/.test(names)) return "착공 준비 완료";
  if (/건축허가|개발행위/.test(names)) return "개발·건축 허가";
  if (/공장설립|입주계약|사업계획/.test(names)) return "입지·공장설립 승인";
  if (/등록|사업개시|가동/.test(names)) return "등록·가동 준비";

  const stageOrder = Object.keys(stageLabels) as Array<keyof typeof stageLabels>;
  const stage = stageOrder
    .map((candidate) => ({
      candidate,
      count: decisions.filter((decision) => decision.procedure.stage === candidate).length,
    }))
    .sort((left, right) => right.count - left.count || stageOrder.indexOf(left.candidate) - stageOrder.indexOf(right.candidate))[0]?.candidate;
  return stage ? stageGroupTitles[stage] : "절차 착수";
}

export function Swimlane({ decisions, schedule, selectedId, onSelect }: {
  decisions: ProcedureDecision[];
  schedule: ScheduleResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [collapsedLanes, setCollapsedLanes] = useState<string[]>([]);
  const [connectorLayout, setConnectorLayout] = useState<ConnectorLayout>(emptyConnectorLayout);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const connectorMarkerId = `dependency-arrow-${useId().replaceAll(":", "")}`;
  const timelineNodes = useMemo(
    () => new Map(
      (schedule.projectTimeline?.nodes ?? []).map((node) => [node.procedureId, node]),
    ),
    [schedule.projectTimeline],
  );
  const useDateOffsets = schedule.projectTimeline !== null;
  const scheduleNodes = useMemo(
    () => new Map(schedule.nodes.map((node) => [node.procedureId, node])),
    [schedule.nodes],
  );
  const scheduledDecisions = useMemo(
    () => decisions.filter((decision) => scheduleNodes.has(decision.procedure.id)),
    [decisions, scheduleNodes],
  );
  const unscheduledDecisions = useMemo(
    () => decisions.filter((decision) => !scheduleNodes.has(decision.procedure.id)),
    [decisions, scheduleNodes],
  );
  const usedLanes = lanes.filter((lane) =>
    scheduledDecisions.some((decision) => decision.procedure.lane === lane),
  );
  const offsets = useDateOffsets
    ? [...new Set(
        scheduledDecisions.map(
          (decision) => timelineNodes.get(decision.procedure.id)?.startOffsetDays ?? 0,
        ),
      )].sort((a, b) => a - b)
    : [...new Set(
        scheduledDecisions.map(
          (decision) => scheduleNodes.get(decision.procedure.id)?.wave ?? 0,
        ),
      )].sort((a, b) => a - b);
  const activeEdges = useMemo(
    () => {
      const activeEdgeIds = new Set(schedule.activeEdgeIds);
      return catalog.edges.filter((edge) => activeEdgeIds.has(edge.id));
    },
    [schedule.activeEdgeIds],
  );
  const decisionNames = new Map(
    decisions.map((decision) => [decision.procedure.id, decision.procedure.name]),
  );

  function toggleLane(lane: string) {
    setCollapsedLanes((current) => current.includes(lane)
      ? current.filter((item) => item !== lane)
      : [...current, lane]);
  }

  function offsetOf(decision: ProcedureDecision) {
    return useDateOffsets
      ? timelineNodes.get(decision.procedure.id)?.startOffsetDays ?? 0
      : scheduleNodes.get(decision.procedure.id)?.wave ?? 0;
  }

  const decisionsByOffset = new Map(
    offsets.map((offset) => [
      offset,
      scheduledDecisions.filter((decision) => offsetOf(decision) === offset),
    ]),
  );
  const columnItemCounts = new Map(
    offsets.map((offset) => [offset, decisionsByOffset.get(offset)?.length ?? 0]),
  );
  const denseOffsets = new Set(
    offsets.filter((offset) =>
      (columnItemCounts.get(offset) ?? 0) >= denseProcedureColumnThreshold,
    ),
  );
  const flowColumnTemplate = offsets.length
    ? offsets
        .map((offset) =>
          denseOffsets.has(offset)
            ? "minmax(440px, 2fr)"
            : "minmax(220px, 1fr)",
        )
        .join(" ")
    : "minmax(220px, 1fr)";

  const sequenceCitationIds = useMemo(
    () => new Set(
      catalog.citations
        .filter((citation) => citation.role === "SEQUENCE")
        .map((citation) => citation.id),
    ),
    [],
  );
  const scheduledProcedureIds = useMemo(
    () => new Set(scheduledDecisions.map((decision) => decision.procedure.id)),
    [scheduledDecisions],
  );
  const connectorEdges = useMemo(
    () => activeEdges
      .filter(
        (edge) =>
          scheduledProcedureIds.has(edge.from) &&
          scheduledProcedureIds.has(edge.to),
      )
      .map((edge) => ({
        edge,
        verifiedSequence: edge.citationIds.some((citationId) =>
          sequenceCitationIds.has(citationId),
        ),
        selected:
          selectedId !== null &&
          (edge.from === selectedId || edge.to === selectedId),
      }))
      .filter(
        ({ edge, verifiedSequence, selected }) =>
          verifiedSequence || (selected && edge.strength !== "ADVISORY"),
      ),
    [activeEdges, scheduledProcedureIds, selectedId, sequenceCitationIds],
  );
  const collapsedKey = collapsedLanes.slice().sort().join("|");

  const measureConnectors = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();
    const visibleCardRects = new Map<string, CardRect>();
    for (const [id, card] of cardRefs.current.entries()) {
      const rect = card.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) visibleCardRects.set(id, rect);
    }
    const routeConnector = createObstacleAvoidingConnectorRouter(
      visibleCardRects,
      gridRect,
      { width: grid.scrollWidth, height: grid.scrollHeight },
    );
    const paths = connectorEdges.flatMap(({ edge, verifiedSequence, selected }) => {
      const path = routeConnector(edge.from, edge.to);
      if (!path) return [];
      return [{
        id: edge.id,
        path,
        strength: edge.strength,
        contextual: !verifiedSequence,
        selected,
      } satisfies ConnectorPath];
    });

    setConnectorLayout({
      width: grid.scrollWidth,
      height: grid.scrollHeight,
      paths,
    });
  }, [connectorEdges]);

  useLayoutEffect(() => {
    measureConnectors();
    const frame = window.requestAnimationFrame(measureConnectors);
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(measureConnectors);
    if (observer && gridRef.current) observer.observe(gridRef.current);
    for (const card of cardRefs.current.values()) observer?.observe(card);
    window.addEventListener("resize", measureConnectors);
    void document.fonts?.ready.then(measureConnectors);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measureConnectors);
    };
  }, [collapsedKey, flowColumnTemplate, measureConnectors]);

  function predecessors(id: string) {
    return activeEdges
      .filter((edge) => edge.to === id)
      .map((edge) => ({
        name: decisionNames.get(edge.from) ?? edge.from,
        strength: edge.strength,
      }));
  }

  function strengthLabel(strength: "LEGAL_HARD" | "PRACTICAL" | "ADVISORY") {
    if (strength === "LEGAL_HARD") return "법정";
    if (strength === "PRACTICAL") return "실무";
    return "참고";
  }

  return (
    <section className="swimlane-shell" aria-label="선후행 순서와 병렬 진행을 표시한 인허가 흐름">
      <ol className="phase-route" aria-label="사업 단계">
        {Object.entries(stageLabels).map(([stage, label], index) => (
          <li key={stage}><span>{index + 1}</span><strong>{label}</strong></li>
        ))}
      </ol>
      <div className="swimlane-legend" aria-label="표시 범례">
        <span><i className="legend-line hard" /> 법정 선후행</span>
        <span><i className="legend-line practical" /> 실무 선후행 · 선택 시 확장</span>
        <span><i className="legend-overlap" /> 공사와 병행</span>
        <span><i className="legend-critical" /> 총기간 연장</span>
      </div>
      <p className="flow-instruction">왼쪽에서 오른쪽 순서로 진행합니다. 조문에서 선후행이 확인된 절차는 화살표로 잇고, 카드를 선택하면 관련 실무 연결도 점선으로 펼칩니다. 같은 열은 선행조건 충족 후 병행할 수 있습니다.</p>
      <div className="swimlane-scroll" tabIndex={0} aria-label="가로로 스크롤할 수 있는 인허가 순서표">
        <div
          ref={gridRef}
          className="swimlane-grid flow-grid"
          style={{ gridTemplateColumns: `180px ${flowColumnTemplate}` }}
          data-evidence-edge-count={connectorEdges.filter((item) => item.verifiedSequence).length}
          data-context-edge-count={connectorEdges.filter((item) => !item.verifiedSequence).length}
        >
          {connectorLayout.width > 0 && connectorLayout.height > 0 ? (
            <svg
              className="dependency-connector-layer"
              width={connectorLayout.width}
              height={connectorLayout.height}
              viewBox={`0 0 ${connectorLayout.width} ${connectorLayout.height}`}
              aria-hidden="true"
            >
              <defs>
                <marker
                  id={connectorMarkerId}
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" />
                </marker>
              </defs>
              {connectorLayout.paths.map((connector) => (
                <g key={connector.id}>
                  <path className="dependency-connector-halo" d={connector.path} />
                  <path
                    className={`dependency-connector-line strength-${connector.strength.toLowerCase()}${connector.contextual ? " is-contextual" : ""}${connector.selected ? " is-selected" : ""}`}
                    d={connector.path}
                    markerEnd={`url(#${connectorMarkerId})`}
                  />
                </g>
              ))}
            </svg>
          ) : null}
          <div className="swimlane-corner">주관 기관 / 착수 시점</div>
          {offsets.map((offset, index) => {
            const groupDecisions = decisionsByOffset.get(offset) ?? [];
            const sample = groupDecisions[0];
            const node = sample ? timelineNodes.get(sample.procedure.id) : undefined;
            const count = groupDecisions.length;
            return (
              <div className="stage-header flow-header" key={offset}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{flowGroupTitle(groupDecisions)}</strong>
                <small>{useDateOffsets ? `${dateText(node?.startDate)} · 시작 후 ${offset}일` : "선후행 기준"} · {count > 1 ? `${count}개 병렬` : "1개 절차"}</small>
              </div>
            );
          })}
          {usedLanes.map((lane) => (
            <div className={`swimlane-row ${collapsedLanes.includes(lane) ? "is-collapsed" : ""}`} key={lane}>
              <button type="button" className="lane-header" aria-expanded={!collapsedLanes.includes(lane)} onClick={() => toggleLane(lane)}>
                <span className="lane-marker" aria-hidden="true" />
                <strong>{laneLabels[lane]}</strong>
                <span className="lane-toggle" aria-hidden="true">{collapsedLanes.includes(lane) ? "+" : "−"}</span>
              </button>
              {offsets.map((offset) => {
                const cells = (decisionsByOffset.get(offset) ?? [])
                  .filter((decision) => decision.procedure.lane === lane)
                  .sort((left, right) => {
                    const leftNode = timelineNodes.get(left.procedure.id);
                    const rightNode = timelineNodes.get(right.procedure.id);
                    return (leftNode?.finishOffsetDays ?? 0) - (rightNode?.finishOffsetDays ?? 0)
                      || left.procedure.name.localeCompare(right.procedure.name, "ko");
                  });
                const parallelCount = columnItemCounts.get(offset) ?? 0;
                const isDense = denseOffsets.has(offset);
                return (
                  <div
                    className={`lane-cell flow-cell${isDense ? " is-dense" : ""}`}
                    key={`${lane}-${offset}`}
                    data-item-count={cells.length}
                    data-column-item-count={parallelCount}
                    aria-hidden={collapsedLanes.includes(lane)}
                  >
                    {cells.map((decision) => {
                      const timelineNode = timelineNodes.get(decision.procedure.id);
                      const incoming = predecessors(decision.procedure.id);
                      return (
                        <button
                          ref={(node) => {
                            if (node) cardRefs.current.set(decision.procedure.id, node);
                            else cardRefs.current.delete(decision.procedure.id);
                          }}
                          type="button"
                          key={decision.procedure.id}
                          className={`procedure-card status-card-${isInputMatchedRoadmapInclusion(decision) ? "roadmap_included" : decision.status.toLowerCase()} ${timelineNode?.extendsOperationReady ? "is-critical" : ""} ${timelineNode?.overlapsConstruction ? "is-overlap" : ""} ${selectedId === decision.procedure.id ? "is-selected" : ""}`}
                          aria-label={`${decision.procedure.name} 상세 보기`}
                          aria-pressed={selectedId === decision.procedure.id}
                          onClick={() => onSelect(decision.procedure.id)}
                        >
                          <span className="procedure-card-topline"><StatusBadge status={decision.status} isDeemed={decision.isDeemed} provisionalEffect={decision.provisionalEffect} missingInputs={decision.missingInputs} conflictRuleIds={decision.conflictRuleIds} needsLegalReview={decision.needsLegalReview} compact /><span>{stageLabels[decision.procedure.stage]}</span></span>
                          <strong>{decision.procedure.name}</strong>
                          {decision.specialLawImpacts?.length ? <span className="special-law-chip">{decision.specialLawImpacts[0].effectLabel} · {decision.specialLawImpacts[0].statusLabel}</span> : null}
                          <span className="procedure-meta">{planningLabel(timelineNode)}{parallelCount > 1 ? <em>병렬</em> : null}</span>
                          {incoming.length ? (
                            <span className="procedure-route">
                              <b>← 선행절차</b>
                              <span className="procedure-route-list">
                                {incoming.slice(0, 3).map((item) => (
                                  <span className={`route-chip route-${item.strength.toLowerCase()}`} key={`${item.name}-${item.strength}`}>
                                    <em>{strengthLabel(item.strength)}</em>{item.name}
                                  </span>
                                ))}
                                {incoming.length > 3 ? <span className="route-more">외 {incoming.length - 3}개</span> : null}
                              </span>
                            </span>
                          ) : <span className="procedure-route route-start"><b>시작 가능</b> 직접 선행절차 없음</span>}
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
      {unscheduledDecisions.length ? (
        <section className="unscheduled-procedures">
          <h3>현재 일정에서 제외된 절차</h3>
          <p>비적용 조건과 일치했거나 일정 포함 설정에서 빠진 항목입니다. 상세 화면에서 판정 이유를 확인할 수 있습니다.</p>
          <div>{unscheduledDecisions.map((decision) => <button type="button" key={decision.procedure.id} onClick={() => onSelect(decision.procedure.id)}><StatusBadge status={decision.status} isDeemed={decision.isDeemed} provisionalEffect={decision.provisionalEffect} missingInputs={decision.missingInputs} conflictRuleIds={decision.conflictRuleIds} needsLegalReview={decision.needsLegalReview} compact />{decision.procedure.name}</button>)}</div>
        </section>
      ) : null}
      <p className="panel-footnote">카드를 선택하면 적용 이유, 제출자료, 선행·후속 절차와 법령 원문을 확인할 수 있습니다.</p>
    </section>
  );
}
