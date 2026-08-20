import type {
  DurationEstimate,
  ProcedureEdge,
} from "@/lib/domain/schemas";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";

export type DurationScenario = "MIN" | "BASE" | "MAX";

export type ScheduleNode = {
  procedureId: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  duration: number | null;
  critical: boolean;
};

export type ScheduleResult = {
  scenario: DurationScenario;
  unit: "BUSINESS_DAY";
  total: number;
  complete: boolean;
  nodes: ScheduleNode[];
  topologicalOrder: string[];
  criticalProcedureIds: string[];
  unknownDurationProcedureIds: string[];
  warnings: string[];
};

function topologicalSort(ids: string[], edges: ProcedureEdge[]) {
  const selected = new Set(ids);
  const indegree = new Map(ids.map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    if (!selected.has(edge.from) || !selected.has(edge.to)) continue;
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }
  const queue = [...indegree.entries()]
    .filter(([, value]) => value === 0)
    .map(([id]) => id)
    .sort();
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of (outgoing.get(id) ?? []).sort()) {
      const value = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, value);
      if (value === 0) queue.push(next);
    }
    queue.sort();
  }
  if (order.length !== ids.length) {
    throw new Error("선택된 절차 그래프에 순환이 있어 일정을 계산할 수 없습니다.");
  }
  return order;
}

function durationValue(
  estimate: DurationEstimate | undefined,
  scenario: DurationScenario,
) {
  const range = estimate?.elapsed;
  if (!range || range.unit !== "BUSINESS_DAY") return null;
  if (scenario === "MIN") return range.min;
  if (scenario === "MAX") return range.max;
  return range.base;
}

export function calculateSchedule({
  decisions,
  edges,
  durations,
  scenario,
  includeConditional,
  includePractical,
}: {
  decisions: ProcedureDecision[];
  edges: ProcedureEdge[];
  durations: DurationEstimate[];
  scenario: DurationScenario;
  includeConditional: boolean;
  includePractical: boolean;
}): ScheduleResult {
  const selectedDecisions = decisions.filter((decision) => {
    if (decision.status === "APPLIES") return true;
    if (!includeConditional) return false;
    return ["POSSIBLY_APPLIES", "NEEDS_MORE_INFO"].includes(decision.status);
  });
  const ids = selectedDecisions.map((decision) => decision.procedure.id).sort();
  const selected = new Set(ids);
  const activeEdges = edges
    .filter((edge) => selected.has(edge.from) && selected.has(edge.to))
    .filter((edge) => edge.strength === "LEGAL_HARD" || (includePractical && edge.strength === "PRACTICAL"))
    .filter((edge) => edge.lagUnit === "BUSINESS_DAY")
    .sort((a, b) => a.id.localeCompare(b.id));
  const order = topologicalSort(ids, activeEdges);
  const durationByProcedure = new Map(
    durations.map((estimate) => [estimate.procedureId, durationValue(estimate, scenario)]),
  );
  const unknownDurationProcedureIds = ids.filter(
    (id) => durationByProcedure.get(id) === null || durationByProcedure.get(id) === undefined,
  );
  const numericDuration = (id: string) => durationByProcedure.get(id) ?? 0;
  const earliestStart = new Map(ids.map((id) => [id, 0]));
  const earliestFinish = new Map(ids.map((id) => [id, numericDuration(id)]));

  for (const id of order) {
    const duration = numericDuration(id);
    const incoming = activeEdges.filter((edge) => edge.to === id);
    let start = 0;
    for (const edge of incoming) {
      const predecessorDuration = numericDuration(edge.from);
      const predecessorStart = earliestStart.get(edge.from) ?? 0;
      const predecessorFinish = earliestFinish.get(edge.from) ?? predecessorStart + predecessorDuration;
      const candidate =
        edge.relation === "FINISH_TO_START"
          ? predecessorFinish + edge.lag
          : edge.relation === "START_TO_START"
            ? predecessorStart + edge.lag
            : predecessorFinish + edge.lag - duration;
      start = Math.max(start, candidate);
    }
    earliestStart.set(id, start);
    earliestFinish.set(id, start + duration);
  }

  const total = Math.max(0, ...ids.map((id) => earliestFinish.get(id) ?? 0));
  const latestStart = new Map(ids.map((id) => [id, total - numericDuration(id)]));

  for (const id of [...order].reverse()) {
    const duration = numericDuration(id);
    const outgoing = activeEdges.filter((edge) => edge.from === id);
    let latest = total - duration;
    if (outgoing.length) {
      latest = Math.min(
        ...outgoing.map((edge) => {
          const successorDuration = numericDuration(edge.to);
          const successorLatest = latestStart.get(edge.to) ?? total - successorDuration;
          if (edge.relation === "FINISH_TO_START") {
            return successorLatest - edge.lag - duration;
          }
          if (edge.relation === "START_TO_START") {
            return successorLatest - edge.lag;
          }
          return successorLatest + successorDuration - edge.lag - duration;
        }),
      );
    }
    latestStart.set(id, latest);
  }

  const nodes = order.map((procedureId) => {
    const duration = durationByProcedure.get(procedureId) ?? null;
    const start = earliestStart.get(procedureId) ?? 0;
    const finish = earliestFinish.get(procedureId) ?? start;
    const latest = latestStart.get(procedureId) ?? start;
    const slack = Math.max(0, latest - start);
    return {
      procedureId,
      earliestStart: start,
      earliestFinish: finish,
      latestStart: latest,
      latestFinish: latest + (duration ?? 0),
      slack,
      duration,
      critical: Math.abs(slack) < 1e-9,
    } satisfies ScheduleNode;
  });

  const warnings: string[] = [];
  if (unknownDurationProcedureIds.length) {
    warnings.push(
      `기간 자료가 없는 ${unknownDurationProcedureIds.length}개 절차를 0일로 가정한 부분 계산입니다. 총 사업기간으로 사용하지 마십시오.`,
    );
  }
  if (!includePractical) {
    warnings.push("법적 선행관계만 반영했으며 실무상 권장 선후행관계는 제외했습니다.");
  }
  warnings.push("영업일을 달력일로 환산하지 않았으며 공휴일 달력과 실제 공사기간·인력·예산 제약은 반영하지 않았습니다.");

  return {
    scenario,
    unit: "BUSINESS_DAY",
    total,
    complete: unknownDurationProcedureIds.length === 0,
    nodes,
    topologicalOrder: order,
    criticalProcedureIds: nodes.filter((node) => node.critical).map((node) => node.procedureId),
    unknownDurationProcedureIds,
    warnings,
  };
}
