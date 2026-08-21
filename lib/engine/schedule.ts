import type {
  DurationEstimate,
  ProcedureEdge,
} from "@/lib/domain/schemas";
import {
  KOREAN_BUSINESS_CALENDAR,
  advanceBusinessDays,
  formatIsoDay,
  isCalendarCovered,
  parseIsoDay,
  rewindBusinessDays,
} from "@/lib/calendar/korean-business-calendar";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";

export type DurationScenario = "MIN" | "TYPICAL";

export type ConstructionPlan = {
  /** ISO date used to apply the legal catalog version. */
  assessmentDate: string;
  /** Inclusive construction start date in YYYY-MM-DD format. */
  plannedStartDate: string | null;
  /** Inclusive construction completion date in YYYY-MM-DD format. */
  plannedEndDate: string | null;
};

export type PlanningOverlapPolicy =
  | "PRE_CONSTRUCTION"
  | "DURING_CONSTRUCTION"
  | "PRE_OPERATION"
  | "POST_OPERATION";

export type PlanningReleasePolicy =
  | "EARLIEST_ALLOWED"
  | "CONSTRUCTION_FINISH"
  | "OPERATION_READY";

export type DurationUnit = "BUSINESS_DAY" | "CALENDAR_DAY" | "MONTH";

export type PlanningDurationConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "UNVERIFIED";

/** 법령·공식 민원기준에 기록된 단위를 변환하지 않은 자동 일정 입력값. */
export type PlanningDuration = {
  procedureId: string;
  minimum: number | null;
  typical: number | null;
  unit: DurationUnit | null;
  overlapPolicy: PlanningOverlapPolicy;
  releasePolicy: PlanningReleasePolicy;
  evidenceType: DurationEstimate["evidenceType"];
  confidence: PlanningDurationConfidence;
  sourceLabel: string | null;
  assumptions: string[];
  reviewedAt: string | null;
  /** Empty only when preparation, authority review, consultation, and elapsed time are all evidenced. */
  endToEndMissingComponents?: string[];
};

export type ScheduleNode = {
  procedureId: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  duration: number | null;
  critical: boolean;
  /** Zero-based dependency wave; nodes in the same wave can be shown together. */
  wave: number;
  parallel: boolean;
};

export type ProjectTimelineNode = {
  procedureId: string;
  processingDuration: number | null;
  processingUnit: DurationUnit | null;
  overlapPolicy: PlanningOverlapPolicy;
  startOffsetDays: number;
  finishOffsetDays: number;
  startDate: string;
  /** 완료일(0일 즉시처리는 시작일). */
  finishDate: string;
  wave: number;
  parallel: boolean;
  overlapsConstruction: boolean;
  overlapWithConstructionDays: number;
  extendsOperationReady: boolean;
  excludedFromOperationReady: boolean;
  durationEvidenceType: DurationEstimate["evidenceType"];
  durationConfidence: PlanningDurationConfidence;
  durationSourceLabel: string | null;
  durationAssumptions: string[];
};

export type ProjectTimelineDurationStatus =
  | "CALCULATED"
  | "CONDITIONAL_INCLUDED"
  | "MINIMUM_ONLY";

export type ProjectTimelineResult = {
  unit: "CALENDAR_DAY";
  projectStartDate: string;
  plannedConstructionStartDate: string;
  plannedConstructionEndDate: string;
  adjustedConstructionStartDate: string | null;
  constructionCompletionDate: string | null;
  operationReadyDate: string | null;
  minimumKnownCompletionDate: string;
  postOperationCompletionDate: string | null;
  /** Null unless all operation-ready paths have a usable planning duration. */
  totalCalendarDays: number | null;
  /** Lower bound calculated from the entered construction plan and known values. */
  minimumKnownCalendarDays: number;
  plannedPreConstructionCalendarDays: number;
  /** Safe denominator for rendering the known portion of the schedule. */
  displayHorizonDays: number;
  durationStatus: ProjectTimelineDurationStatus;
  permitLeadCalendarDays: number | null;
  constructionCalendarDays: number;
  constructionDelayCalendarDays: number | null;
  absorbedByConstructionCalendarDays: number;
  complete: boolean;
  unknownPlanningDurationProcedureIds: string[];
  /** Procedures with a processing value but an incomplete preparation/review/consultation breakdown. */
  incompleteDurationComponentProcedureIds: string[];
  conditionalProcedureIds: string[];
  omittedConditionalProcedureIds: string[];
  provisionalExcludedProcedureIds: string[];
  postOperationProcedureIds: string[];
  nodes: ProjectTimelineNode[];
  warnings: string[];
};

export type ScheduleResult = {
  scenario: DurationScenario;
  unit: "BUSINESS_DAY";
  total: number;
  complete: boolean;
  nodes: ScheduleNode[];
  topologicalOrder: string[];
  activeEdgeIds: string[];
  criticalProcedureIds: string[];
  unknownDurationProcedureIds: string[];
  warnings: string[];
  /** 공사 일정과 공식 처리기간을 날짜 단위로 결합한 결과. */
  projectTimeline: ProjectTimelineResult | null;
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

function dependencyWaves(ids: string[], edges: ProcedureEdge[], order: string[]) {
  const selected = new Set(ids);
  const wave = new Map(ids.map((id) => [id, 0]));
  for (const id of order) {
    const incoming = edges.filter(
      (edge) => selected.has(edge.from) && edge.to === id,
    );
    const value = incoming.reduce((maximum, edge) => {
      const predecessorWave = wave.get(edge.from) ?? 0;
      // Start-to-start and finish-to-finish work may occupy the same visual wave.
      const step = edge.relation === "FINISH_TO_START" ? 1 : 0;
      return Math.max(maximum, predecessorWave + step);
    }, 0);
    wave.set(id, value);
  }
  const countByWave = new Map<number, number>();
  for (const value of wave.values()) {
    countByWave.set(value, (countByWave.get(value) ?? 0) + 1);
  }
  return { wave, countByWave };
}

function durationValue(
  estimate: DurationEstimate | undefined,
  scenario: DurationScenario,
) {
  const range = estimate?.elapsed;
  if (!range || range.unit !== "BUSINESS_DAY") return null;
  if (scenario === "MIN") return range.min;
  return range.base;
}

function planningDurationValue(
  estimate: PlanningDuration | undefined,
  scenario: DurationScenario,
) {
  if (!estimate) return null;
  return scenario === "MIN" ? estimate.minimum : estimate.typical;
}

function addCalendarMonths(day: number, months: number) {
  const date = new Date(day * 86_400_000);
  const firstOfTargetMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      firstOfTargetMonth.getUTCFullYear(),
      firstOfTargetMonth.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();
  const target = new Date(
    Date.UTC(
      firstOfTargetMonth.getUTCFullYear(),
      firstOfTargetMonth.getUTCMonth(),
      Math.min(date.getUTCDate(), lastDayOfTargetMonth),
    ),
  );
  return Math.floor(target.getTime() / 86_400_000);
}

function isValidPlanningDuration(value: PlanningDuration) {
  const values = [value.minimum, value.typical];
  if (values.some((part) => part !== null && (!Number.isInteger(part) || part < 0))) {
    return false;
  }
  const hasNumericValue = values.some((part) => part !== null);
  if (hasNumericValue && value.unit === null) return false;
  if (
    hasNumericValue &&
    (value.evidenceType === "INSUFFICIENT_DATA" ||
      value.sourceLabel === null)
  ) {
    return false;
  }
  if (hasNumericValue && value.reviewedAt === null) return false;
  if (
    hasNumericValue &&
    value.evidenceType === "EXPERT_ESTIMATE" &&
    value.assumptions.length === 0
  ) {
    return false;
  }
  if (
    value.minimum !== null &&
    value.typical !== null &&
    value.minimum > value.typical
  ) {
    return false;
  }
  return true;
}

function advanceByUnit(start: number, value: number, unit: DurationUnit) {
  if (unit === "BUSINESS_DAY") return advanceBusinessDays(start, value);
  if (unit === "CALENDAR_DAY") return start + value;
  return addCalendarMonths(start, value);
}

function rewindByUnit(finish: number, value: number, unit: DurationUnit) {
  if (unit === "BUSINESS_DAY") return rewindBusinessDays(finish, value);
  if (unit === "CALENDAR_DAY") return finish - value;
  return addCalendarMonths(finish, -value);
}

function advanceEdgeLag(start: number, edge: ProcedureEdge) {
  if (edge.lag === 0) return start;
  return advanceByUnit(start, edge.lag, edge.lagUnit);
}

function unionLength(intervals: Array<[number, number]>) {
  const sorted = intervals
    .filter(([start, finish]) => finish > start)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (!sorted.length) return 0;
  let total = 0;
  let [start, finish] = sorted[0];
  for (const [nextStart, nextFinish] of sorted.slice(1)) {
    if (nextStart <= finish) {
      finish = Math.max(finish, nextFinish);
    } else {
      total += finish - start;
      start = nextStart;
      finish = nextFinish;
    }
  }
  return total + finish - start;
}

function buildProjectTimeline({
  ids,
  edges,
  order,
  scenario,
  constructionPlan,
  planningDurations,
  conditionalProcedureIds,
  omittedConditionalProcedureIds,
  provisionalExcludedProcedureIds,
}: {
  ids: string[];
  edges: ProcedureEdge[];
  order: string[];
  scenario: DurationScenario;
  constructionPlan: ConstructionPlan;
  planningDurations: PlanningDuration[];
  conditionalProcedureIds: string[];
  omittedConditionalProcedureIds: string[];
  provisionalExcludedProcedureIds: string[];
}): { timeline: ProjectTimelineResult | null; warnings: string[] } {
  const warnings: string[] = [];
  const assessmentDay = parseIsoDay(constructionPlan.assessmentDate);
  const plannedStartDay = constructionPlan.plannedStartDate
    ? parseIsoDay(constructionPlan.plannedStartDate)
    : null;
  const plannedEndDay = constructionPlan.plannedEndDate
    ? parseIsoDay(constructionPlan.plannedEndDate)
    : null;

  if (
    assessmentDay === null ||
    plannedStartDay === null ||
    plannedEndDay === null
  ) {
    warnings.push("통합 일정에는 유효한 평가일과 공사 시작일·완료일(YYYY-MM-DD)이 모두 필요합니다.");
    return { timeline: null, warnings };
  }

  const constructionCalendarDays = plannedEndDay - plannedStartDay + 1;
  if (constructionCalendarDays <= 0) {
    warnings.push("공사 완료일은 공사 시작일보다 빠를 수 없습니다.");
    return { timeline: null, warnings };
  }

  const planningStartDay = Math.min(assessmentDay, plannedStartDay);
  const plannedEndBoundary = plannedEndDay + 1;
  if (
    !isCalendarCovered(planningStartDay) ||
    !isCalendarCovered(plannedStartDay) ||
    !isCalendarCovered(plannedEndDay)
  ) {
    warnings.push(
      "자동 업무일 계산은 " +
        KOREAN_BUSINESS_CALENDAR.validFrom +
        "부터 " +
        KOREAN_BUSINESS_CALENDAR.validTo +
        "까지 지원합니다.",
    );
    return { timeline: null, warnings };
  }
  if (plannedStartDay < assessmentDay) {
    warnings.push(
      "입력한 공사 시작일이 검토 기준일보다 빠르므로, 총기간은 입력한 착공일부터 확인된 절차와 공사를 합산했습니다.",
    );
  }

  const selectedIds = new Set(ids);
  const duplicateIds = planningDurations
    .filter((item) => selectedIds.has(item.procedureId))
    .map((item) => item.procedureId)
    .filter((id, index, all) => all.indexOf(id) !== index);
  const invalidIds = planningDurations
    .filter((item) => selectedIds.has(item.procedureId) && !isValidPlanningDuration(item))
    .map((item) => item.procedureId);

  if (duplicateIds.length) {
    warnings.push("공식 처리기간이 중복된 " + new Set(duplicateIds).size + "개 절차는 마지막 값을 사용했습니다.");
  }
  if (invalidIds.length) {
    warnings.push("처리기간 범위 또는 근거 메타가 잘못된 " + new Set(invalidIds).size + "개 절차는 기간 미확인으로 처리했습니다.");
  }

  const planningByProcedure = new Map<string, PlanningDuration>();
  for (const item of planningDurations) planningByProcedure.set(item.procedureId, item);

  const valueByProcedure = new Map<string, number | null>();
  for (const id of ids) {
    const item = planningByProcedure.get(id);
    valueByProcedure.set(
      id,
      item && isValidPlanningDuration(item) ? planningDurationValue(item, scenario) : null,
    );
  }

  const unknownPlanningDurationProcedureIds = ids.filter(
    (id) => valueByProcedure.get(id) === null || valueByProcedure.get(id) === undefined,
  );
  const calendarGapProcedureIds = new Set<string>();
  const policy = (id: string): PlanningOverlapPolicy =>
    planningByProcedure.get(id)?.overlapPolicy ?? "PRE_CONSTRUCTION";
  const release = (id: string): PlanningReleasePolicy =>
    planningByProcedure.get(id)?.releasePolicy ?? "EARLIEST_ALLOWED";

  const finishAfterDuration = (id: string, start: number) => {
    const item = planningByProcedure.get(id);
    const value = valueByProcedure.get(id);
    if (!item || value === null || value === undefined || item.unit === null) return start;
    const finish = advanceByUnit(start, value, item.unit);
    if (finish === null || !isCalendarCovered(Math.max(start, finish - 1))) {
      calendarGapProcedureIds.add(id);
      return start;
    }
    return finish;
  };

  const startBeforeDuration = (id: string, finish: number) => {
    const item = planningByProcedure.get(id);
    const value = valueByProcedure.get(id);
    if (!item || value === null || value === undefined || item.unit === null) return finish;
    const start = rewindByUnit(finish, value, item.unit);
    if (start === null || !isCalendarCovered(start)) {
      calendarGapProcedureIds.add(id);
      return finish;
    }
    return start;
  };

  const edgeCandidate = (
    edge: ProcedureEdge,
    itemId: string,
    predecessorStart: number,
    predecessorFinish: number,
  ) => {
    const laggedStart = advanceEdgeLag(predecessorStart, edge);
    const laggedFinish = advanceEdgeLag(predecessorFinish, edge);
    if (laggedStart === null || laggedFinish === null) {
      calendarGapProcedureIds.add(itemId);
      return null;
    }
    if (edge.relation === "FINISH_TO_START") return laggedFinish;
    if (edge.relation === "START_TO_START") return laggedStart;
    return startBeforeDuration(itemId, laggedFinish);
  };

  const { wave } = dependencyWaves(ids, edges, order);
  const incomingByProcedure = new Map<string, ProcedureEdge[]>();
  for (const edge of edges) {
    incomingByProcedure.set(edge.to, [...(incomingByProcedure.get(edge.to) ?? []), edge]);
  }

  const preConstructionIds = ids.filter((id) => policy(id) === "PRE_CONSTRUCTION");
  const unknownPreConstructionIds = preConstructionIds.filter((id) =>
    unknownPlanningDurationProcedureIds.includes(id),
  );
  const unknownOperationReadyProcedureIds = unknownPlanningDurationProcedureIds.filter(
    (id) => policy(id) !== "POST_OPERATION",
  );
  const unknownPostOperationProcedureIds = unknownPlanningDurationProcedureIds.filter(
    (id) => policy(id) === "POST_OPERATION",
  );
  const incompleteDurationComponentProcedureIds = ids.filter(
    (id) =>
      valueByProcedure.get(id) !== null &&
      valueByProcedure.get(id) !== undefined &&
      (planningByProcedure.get(id)?.endToEndMissingComponents?.length ?? 0) > 0,
  );
  const incompleteOperationReadyDurationComponentProcedureIds =
    incompleteDurationComponentProcedureIds.filter(
      (id) => policy(id) !== "POST_OPERATION",
    );
  const incompletePreConstructionDurationComponentProcedureIds =
    incompleteDurationComponentProcedureIds.filter(
      (id) => policy(id) === "PRE_CONSTRUCTION",
    );
  const conditionalOperationReadyProcedureIds = conditionalProcedureIds.filter(
    (id) => policy(id) !== "POST_OPERATION",
  );
  const omittedConditionalOperationReadyProcedureIds = omittedConditionalProcedureIds.filter(
    (id) => policy(id) !== "POST_OPERATION",
  );

  let phaseInversionCount = 0;
  const preStart = new Map(ids.map((id) => [id, planningStartDay]));
  const preFinish = new Map(ids.map((id) => [id, finishAfterDuration(id, planningStartDay)]));
  for (const id of order) {
    if (policy(id) !== "PRE_CONSTRUCTION") continue;
    let start = planningStartDay;
    for (const edge of incomingByProcedure.get(id) ?? []) {
      if (policy(edge.from) !== "PRE_CONSTRUCTION") {
        phaseInversionCount += 1;
        warnings.push(edge.from + " → " + id + " 선후행이 공사 이후 단계에서 착공 전 단계로 역행합니다.");
        continue;
      }
      const predecessorStart = preStart.get(edge.from) ?? planningStartDay;
      const predecessorFinish = preFinish.get(edge.from) ?? predecessorStart;
      const candidate = edgeCandidate(edge, id, predecessorStart, predecessorFinish);
      if (candidate !== null) start = Math.max(start, candidate);
    }
    preStart.set(id, start);
    preFinish.set(id, finishAfterDuration(id, start));
  }

  const permitFinishBoundary = Math.max(
    planningStartDay,
    ...preConstructionIds.map((id) => preFinish.get(id) ?? planningStartDay),
  );
  const adjustedConstructionStart = Math.max(plannedStartDay, permitFinishBoundary);
  const constructionFinishBoundary = adjustedConstructionStart + constructionCalendarDays;
  const constructionDelayCalendarDays = adjustedConstructionStart - plannedStartDay;

  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();
  for (const id of order) {
    if (policy(id) === "POST_OPERATION") continue;
    const itemPolicy = policy(id);
    let start =
      itemPolicy === "PRE_CONSTRUCTION"
        ? preStart.get(id) ?? planningStartDay
        : itemPolicy === "DURING_CONSTRUCTION"
          ? adjustedConstructionStart
          : release(id) === "CONSTRUCTION_FINISH"
            ? constructionFinishBoundary
            : Math.max(adjustedConstructionStart, startBeforeDuration(id, constructionFinishBoundary));

    for (const edge of incomingByProcedure.get(id) ?? []) {
      const predecessorStart = earliestStart.get(edge.from);
      const predecessorFinish = earliestFinish.get(edge.from);
      if (predecessorStart === undefined || predecessorFinish === undefined) {
        if (policy(edge.from) === "POST_OPERATION") {
          phaseInversionCount += 1;
          warnings.push(edge.from + " → " + id + " 선후행이 가동 후 단계에서 가동 전 단계로 역행합니다.");
        }
        continue;
      }
      const candidate = edgeCandidate(edge, id, predecessorStart, predecessorFinish);
      if (candidate !== null) start = Math.max(start, candidate);
    }
    earliestStart.set(id, start);
    earliestFinish.set(id, finishAfterDuration(id, start));
  }

  const operationReadyBoundary = Math.max(
    constructionFinishBoundary,
    ...ids
      .filter((id) => policy(id) !== "POST_OPERATION")
      .map((id) => earliestFinish.get(id) ?? planningStartDay),
  );
  const postOperationProcedureIds = ids.filter((id) => policy(id) === "POST_OPERATION");

  for (const id of order) {
    if (policy(id) !== "POST_OPERATION") continue;
    let start = operationReadyBoundary;
    for (const edge of incomingByProcedure.get(id) ?? []) {
      const predecessorStart = earliestStart.get(edge.from);
      const predecessorFinish = earliestFinish.get(edge.from);
      if (predecessorStart === undefined || predecessorFinish === undefined) continue;
      const candidate = edgeCandidate(edge, id, predecessorStart, predecessorFinish);
      if (candidate !== null) start = Math.max(start, candidate);
    }
    earliestStart.set(id, start);
    earliestFinish.set(id, finishAfterDuration(id, start));
  }

  const postOperationBoundary = postOperationProcedureIds.length
    ? Math.max(
        operationReadyBoundary,
        ...postOperationProcedureIds.map((id) => earliestFinish.get(id) ?? operationReadyBoundary),
      )
    : null;

  const nodeDrafts = order.map((procedureId) => {
    const start = earliestStart.get(procedureId) ?? planningStartDay;
    const finish = earliestFinish.get(procedureId) ?? start;
    const overlapStart = Math.max(start, adjustedConstructionStart);
    const overlapFinish = Math.min(finish, constructionFinishBoundary);
    const overlapWithConstructionDays = Math.max(0, overlapFinish - overlapStart);
    const excludedFromOperationReady = policy(procedureId) === "POST_OPERATION";
    const planning = planningByProcedure.get(procedureId);
    return {
      procedureId,
      processingDuration: valueByProcedure.get(procedureId) ?? null,
      processingUnit: planning?.unit ?? null,
      overlapPolicy: policy(procedureId),
      startOffsetDays: start - planningStartDay,
      finishOffsetDays: finish - planningStartDay,
      startDate: formatIsoDay(start),
      finishDate: formatIsoDay(finish > start ? finish - 1 : start),
      wave: wave.get(procedureId) ?? 0,
      parallel: false,
      overlapsConstruction: overlapWithConstructionDays > 0,
      overlapWithConstructionDays,
      extendsOperationReady: !excludedFromOperationReady && finish > constructionFinishBoundary,
      excludedFromOperationReady,
      durationEvidenceType: planning?.evidenceType ?? "INSUFFICIENT_DATA",
      durationConfidence: planning?.confidence ?? "UNVERIFIED",
      durationSourceLabel: planning?.sourceLabel ?? null,
      durationAssumptions: planning?.assumptions ?? [],
    } satisfies ProjectTimelineNode;
  });

  const nodes = nodeDrafts.map((node) => {
    const start = earliestStart.get(node.procedureId) ?? planningStartDay;
    const finish = earliestFinish.get(node.procedureId) ?? start;
    return {
      ...node,
      parallel: nodeDrafts.some((candidate) => {
        if (candidate.procedureId === node.procedureId) return false;
        const candidateStart = earliestStart.get(candidate.procedureId) ?? planningStartDay;
        const candidateFinish = earliestFinish.get(candidate.procedureId) ?? candidateStart;
        if (start === finish && candidateStart === candidateFinish) return start === candidateStart;
        return start < candidateFinish && candidateStart < finish;
      }),
    } satisfies ProjectTimelineNode;
  });

  const absorbedByConstructionCalendarDays = unionLength(
    nodes
      .filter(
        (node) =>
          node.overlapPolicy === "DURING_CONSTRUCTION" ||
          node.overlapPolicy === "PRE_OPERATION",
      )
      .map((node) => [
        Math.max(earliestStart.get(node.procedureId) ?? planningStartDay, adjustedConstructionStart),
        Math.min(earliestFinish.get(node.procedureId) ?? planningStartDay, constructionFinishBoundary),
      ]),
  );

  if (unknownOperationReadyProcedureIds.length) {
    warnings.push(
      "가동 준비 전 절차 " +
        unknownOperationReadyProcedureIds.length +
        "개는 전국 공통 처리기간 근거가 없어, 표시 기간은 확인된 값만 반영한 일정 하한입니다.",
    );
  }
  if (unknownPostOperationProcedureIds.length) {
    warnings.push("가동 후 별도 관리 " + unknownPostOperationProcedureIds.length + "개는 처리기간이 확인되지 않았습니다.");
  }
  if (incompleteOperationReadyDurationComponentProcedureIds.length) {
    warnings.push(
      "가동 준비 전 절차 " +
        incompleteOperationReadyDurationComponentProcedureIds.length +
        "개는 신청인 준비·기관 심사·관계기관 협의·전체 경과 중 일부 기간이 없어, 표시 기간은 공식 처리기간만 반영한 일정 하한입니다.",
    );
  }
  if (calendarGapProcedureIds.size) {
    warnings.push("공휴일 달력 지원범위를 벗어난 " + calendarGapProcedureIds.size + "개 절차는 기간 미확인으로 처리했습니다.");
  }
  if (conditionalProcedureIds.length) {
    warnings.push("적용 여부가 확정되지 않은 " + conditionalProcedureIds.length + "개 절차를 포함한 일정입니다.");
  }
  if (omittedConditionalProcedureIds.length) {
    warnings.push("대상 확인 절차 일정 포함을 끄면서 " + omittedConditionalProcedureIds.length + "개 미확정 절차를 제외했습니다.");
  }
  if (provisionalExcludedProcedureIds.length) {
    warnings.push("초안 제외규칙과 일치한 " + provisionalExcludedProcedureIds.length + "개 대체·비적용 경로는 일정에 넣지 않았습니다.");
  }
  if (ids.some((id) => planningByProcedure.get(id)?.unit === "BUSINESS_DAY")) {
    warnings.push(
      "업무일 계산은 정기 공휴일과 대체공휴일을 반영했으며, 향후 지정될 임시공휴일·선거일은 포함하지 않았습니다.",
    );
  }

  const structuralGap =
    invalidIds.length > 0 ||
    calendarGapProcedureIds.size > 0 ||
    phaseInversionCount > 0;
  const hasUnknownOperationReadyDuration =
    unknownOperationReadyProcedureIds.length > 0 ||
    omittedConditionalOperationReadyProcedureIds.length > 0 ||
    incompleteOperationReadyDurationComponentProcedureIds.length > 0;
  const computedOperationReadyCalendarDays = Math.max(0, operationReadyBoundary - planningStartDay);
  const durationStatus: ProjectTimelineDurationStatus =
    hasUnknownOperationReadyDuration || structuralGap
      ? "MINIMUM_ONLY"
      : conditionalOperationReadyProcedureIds.length > 0
        ? "CONDITIONAL_INCLUDED"
        : "CALCULATED";
  const totalCalendarDays =
    durationStatus === "MINIMUM_ONLY" ? null : computedOperationReadyCalendarDays;
  const preConstructionTimingKnown =
    unknownPreConstructionIds.length === 0 &&
    incompletePreConstructionDurationComponentProcedureIds.length === 0 &&
    omittedConditionalOperationReadyProcedureIds.every((id) => policy(id) !== "PRE_CONSTRUCTION") &&
    !structuralGap;
  const visibleConstructionDelayCalendarDays = preConstructionTimingKnown
    ? constructionDelayCalendarDays
    : null;

  if (constructionDelayCalendarDays > 0 && preConstructionTimingKnown) {
    warnings.push("착공 전 절차 때문에 계획 착공일이 " + constructionDelayCalendarDays + "일 뒤로 조정되었습니다.");
  } else if (constructionDelayCalendarDays > 0) {
    warnings.push("확인된 기간만 보면 착공이 최소 " + constructionDelayCalendarDays + "일 늦어질 수 있습니다.");
  }
  if (postOperationProcedureIds.length) {
    warnings.push("가동 후 관리 " + postOperationProcedureIds.length + "개는 가동 준비 완료일과 총 소요기간에서 분리했습니다.");
  }

  return {
    timeline: {
      unit: "CALENDAR_DAY",
      projectStartDate: formatIsoDay(planningStartDay),
      plannedConstructionStartDate: formatIsoDay(plannedStartDay),
      plannedConstructionEndDate: formatIsoDay(plannedEndBoundary - 1),
      adjustedConstructionStartDate: preConstructionTimingKnown
        ? formatIsoDay(adjustedConstructionStart)
        : null,
      constructionCompletionDate: preConstructionTimingKnown
        ? formatIsoDay(constructionFinishBoundary - 1)
        : null,
      operationReadyDate:
        totalCalendarDays === null ? null : formatIsoDay(Math.max(planningStartDay, operationReadyBoundary - 1)),
      minimumKnownCompletionDate: formatIsoDay(Math.max(planningStartDay, operationReadyBoundary - 1)),
      postOperationCompletionDate:
        postOperationBoundary === null ||
        totalCalendarDays === null ||
        postOperationProcedureIds.some((id) => unknownPlanningDurationProcedureIds.includes(id))
          ? null
          : formatIsoDay(Math.max(operationReadyBoundary, postOperationBoundary - 1)),
      totalCalendarDays,
      minimumKnownCalendarDays: computedOperationReadyCalendarDays,
      plannedPreConstructionCalendarDays: Math.max(0, plannedStartDay - planningStartDay),
      displayHorizonDays: Math.max(computedOperationReadyCalendarDays, 1),
      durationStatus,
      permitLeadCalendarDays: preConstructionTimingKnown
        ? Math.max(0, permitFinishBoundary - planningStartDay)
        : null,
      constructionCalendarDays,
      constructionDelayCalendarDays: visibleConstructionDelayCalendarDays,
      absorbedByConstructionCalendarDays,
      complete:
        unknownPlanningDurationProcedureIds.length === 0 &&
        incompleteDurationComponentProcedureIds.length === 0 &&
        invalidIds.length === 0 &&
        calendarGapProcedureIds.size === 0 &&
        phaseInversionCount === 0 &&
        conditionalProcedureIds.length === 0,
      unknownPlanningDurationProcedureIds,
      incompleteDurationComponentProcedureIds,
      conditionalProcedureIds,
      omittedConditionalProcedureIds,
      provisionalExcludedProcedureIds,
      postOperationProcedureIds,
      nodes,
      warnings,
    },
    warnings,
  };
}

export function calculateSchedule({
  decisions,
  edges,
  durations,
  scenario,
  includeConditional,
  includePractical,
  constructionPlan,
  planningDurations = [],
}: {
  decisions: ProcedureDecision[];
  edges: ProcedureEdge[];
  durations: DurationEstimate[];
  scenario: DurationScenario;
  includeConditional: boolean;
  includePractical: boolean;
  constructionPlan?: ConstructionPlan;
  planningDurations?: PlanningDuration[];
}): ScheduleResult {
  const isDeterministicInclude = (decision: ProcedureDecision) =>
    decision.status === "APPLIES" ||
    (decision.provisionalEffect === "INCLUDE" && (decision.conflictRuleIds?.length ?? 0) === 0);
  const selectedDecisions = decisions.filter((decision) => {
    if (isDeterministicInclude(decision)) return true;
    if (decision.provisionalEffect === "EXCLUDE") return false;
    if (!includeConditional) return false;
    return ["POSSIBLY_APPLIES", "NEEDS_MORE_INFO"].includes(decision.status);
  });
  const ids = selectedDecisions.map((decision) => decision.procedure.id).sort();
  const selected = new Set(ids);
  const selectableConditionalProcedureIds = decisions
    .filter(
      (decision) =>
        ["POSSIBLY_APPLIES", "NEEDS_MORE_INFO"].includes(decision.status) &&
        !isDeterministicInclude(decision) &&
        decision.provisionalEffect !== "EXCLUDE",
    )
    .map((decision) => decision.procedure.id)
    .sort();
  const conditionalProcedureIds = selectedDecisions
    .filter((decision) => !isDeterministicInclude(decision))
    .map((decision) => decision.procedure.id)
    .sort();
  const omittedConditionalProcedureIds = selectableConditionalProcedureIds.filter(
    (id) => !selected.has(id),
  );
  const provisionalExcludedProcedureIds = decisions
    .filter(
      (decision) =>
        ["POSSIBLY_APPLIES", "NEEDS_MORE_INFO"].includes(decision.status) &&
        decision.provisionalEffect === "EXCLUDE",
    )
    .map((decision) => decision.procedure.id)
    .sort();
  const matchedRuleIds = new Set(
    selectedDecisions.flatMap((decision) => decision.matchedRuleIds),
  );
  const conditionalRuleIds = new Set(
    includeConditional
      ? selectedDecisions.flatMap((decision) =>
          (decision.traces ?? [])
            .filter((trace) => trace.status === "NEEDS_MORE_INFO")
            .map((trace) => trace.ruleId),
        )
      : [],
  );
  const selectedEdges = edges
    .filter((edge) => selected.has(edge.from) && selected.has(edge.to))
    .filter(
      (edge) =>
        edge.conditionRuleId === null ||
        matchedRuleIds.has(edge.conditionRuleId) ||
        conditionalRuleIds.has(edge.conditionRuleId),
    )
    .filter(
      (edge) =>
        edge.strength === "LEGAL_HARD" ||
        (includePractical && edge.strength === "PRACTICAL"),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const activeEdges = selectedEdges.filter(
    (edge) => edge.lagUnit === "BUSINESS_DAY",
  );
  // Keep the visible order and dependency waves faithful to every active
  // legal/practical edge. Only the CPM arithmetic below is restricted to
  // business-day-compatible edges, so calendar-day/month edges are not
  // silently converted but still appear in the correct sequence.
  const order = topologicalSort(ids, selectedEdges);
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

  const { wave, countByWave } = dependencyWaves(ids, selectedEdges, order);
  const nodes = order.map((procedureId) => {
    const duration = durationByProcedure.get(procedureId) ?? null;
    const start = earliestStart.get(procedureId) ?? 0;
    const finish = earliestFinish.get(procedureId) ?? start;
    const latest = latestStart.get(procedureId) ?? start;
    const slack = Math.max(0, latest - start);
    const nodeWave = wave.get(procedureId) ?? 0;
    return {
      procedureId,
      earliestStart: start,
      earliestFinish: finish,
      latestStart: latest,
      latestFinish: latest + (duration ?? 0),
      slack,
      duration,
      critical: Math.abs(slack) < 1e-9,
      wave: nodeWave,
      parallel: (countByWave.get(nodeWave) ?? 0) > 1,
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
  if (!constructionPlan) {
    warnings.push("공사 일정이 없어 공식 업무일 기준의 절차 그래프만 계산했습니다.");
  }

  let projectTimeline: ProjectTimelineResult | null = null;
  if (constructionPlan) {
    const built = buildProjectTimeline({
      ids,
      edges: selectedEdges,
      order,
      scenario,
      constructionPlan,
      planningDurations,
      conditionalProcedureIds,
      omittedConditionalProcedureIds,
      provisionalExcludedProcedureIds,
    });
    projectTimeline = built.timeline;
    warnings.push(...built.warnings);
  }

  return {
    scenario,
    unit: "BUSINESS_DAY",
    total,
    complete: unknownDurationProcedureIds.length === 0,
    nodes,
    topologicalOrder: order,
    activeEdgeIds: selectedEdges.map((edge) => edge.id),
    criticalProcedureIds: nodes.filter((node) => node.critical).map((node) => node.procedureId),
    unknownDurationProcedureIds,
    warnings,
    projectTimeline,
  };
}
