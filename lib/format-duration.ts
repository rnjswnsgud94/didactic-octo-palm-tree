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

