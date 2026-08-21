import type {
  ProjectTimelineNode,
  ScheduleCompletedCheckpoint,
} from "@/lib/engine/schedule";

const DAY_MS = 86_400_000;

function parse(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

/** 시작일과 완료일을 모두 포함한 실제 달력 기간을 년·개월·일로 표시합니다. */
export function formatCalendarPeriod(startDate: string, completionDate: string) {
  const start = parse(startDate);
  const endExclusive = new Date(parse(completionDate).getTime() + DAY_MS);
  let months =
    (endExclusive.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    endExclusive.getUTCMonth() -
    start.getUTCMonth();
  let anchor = new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth() + months,
    start.getUTCDate(),
  ));
  if (anchor > endExclusive) {
    months -= 1;
    anchor = new Date(Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth() + months,
      start.getUTCDate(),
    ));
  }
  const days = Math.max(0, Math.round((endExclusive.getTime() - anchor.getTime()) / DAY_MS));
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [
    years ? `${years}년` : "",
    remainingMonths ? `${remainingMonths}개월` : "",
    days ? `${days}일` : "",
  ].filter(Boolean);
  return parts.join(" ") || "0일";
}

export function formatProcessingDuration(
  value: number | null,
  unit: "BUSINESS_DAY" | "CALENDAR_DAY" | "MONTH" | null,
) {
  if (value === null || unit === null) return "처리기간 확인 필요";
  if (value === 0) return "즉시";
  if (unit === "BUSINESS_DAY") return `${value}업무일`;
  if (unit === "CALENDAR_DAY") return `${value}일`;
  return `${value}개월`;
}

export function formatTimelineProcessingDuration(
  node: Pick<
    ProjectTimelineNode,
    "processingDuration" | "processingUnit" | "completedCheckpoint"
  > & Partial<Pick<
    ProjectTimelineNode,
    "processingUpperBound" | "durationReferencePeriods" | "durationSourceLabel" |
    "durationSource" | "officialProcessingDuration" | "officialProcessingUnit"
  >>,
) {
  const checkpoint = node.completedCheckpoint;
  if (!checkpoint) {
    if (node.durationSource === "USER_EXPECTED" && node.processingDuration !== null) {
      const expected = `사용자 예상 ${formatProcessingDuration(node.processingDuration, node.processingUnit)}`;
      return node.officialProcessingDuration !== null && node.officialProcessingDuration !== undefined
        ? `${expected} · 공식 기준 ${formatProcessingDuration(node.officialProcessingDuration, node.officialProcessingUnit ?? null)}`
        : `${expected} · 공식 총기간 미확인`;
    }
    const referencePriority = {
      OFFICIAL_OPERATION_CAP: 0,
      NATIONWIDE_STATUTORY: 1,
      NATIONWIDE_OFFICIAL_STANDARD: 1,
      LEGAL_DEADLINE: 2,
      PROCESS_MILESTONE: 3,
    } as const;
    const quantifiedReferences = (node.durationReferencePeriods ?? [])
      .filter((period) =>
        period.kind in referencePriority &&
        period.range !== null &&
        period.range.max !== null
      )
      .sort((left, right) =>
        referencePriority[left.kind as keyof typeof referencePriority] -
        referencePriority[right.kind as keyof typeof referencePriority]
      );
    if (node.processingDuration === null && quantifiedReferences.length) {
      const visibleReferences = quantifiedReferences.slice(0, 3);
      const hiddenCount = quantifiedReferences.length - visibleReferences.length;
      return `총기간 미확인 · ${visibleReferences.map((period) =>
        `${period.label} ${formatProcessingDuration(period.range!.max!, period.range!.unit)}`
      ).join(" · ")}${hiddenCount ? ` · 외 ${hiddenCount}개 법정·공식 기준` : ""}`;
    }
    if (
      node.processingDuration === null &&
      node.processingUpperBound !== null &&
      node.processingUpperBound !== undefined &&
      node.processingUnit !== null
    ) {
      return `총기간 미확인 · 공식 상한 ${formatProcessingDuration(node.processingUpperBound, node.processingUnit)}`;
    }
    if (node.processingDuration === null && node.durationSourceLabel) {
      return `총기간 미확인 · ${node.durationSourceLabel}`;
    }
    return formatProcessingDuration(
      node.processingDuration,
      node.processingUnit,
    );
  }
  return formatCompletedCheckpoint(checkpoint);
}

export function formatCompletedCheckpoint(
  checkpoint: Pick<
    ScheduleCompletedCheckpoint,
    "label" | "completedDate" | "confirmedAsOfDate"
  >,
) {
  return checkpoint.completedDate
    ? `${checkpoint.label} · ${checkpoint.completedDate} 완료 · 잔여 처리기간 0일`
    : `${checkpoint.label} · ${checkpoint.confirmedAsOfDate} 기준일 현재 완료 · 잔여 처리기간 0일`;
}
