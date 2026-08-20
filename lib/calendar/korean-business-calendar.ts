const DAY_MS = 86_400_000;

/**
 * 반복되는 대한민국 공휴일을 계산하는 검토 범위입니다.
 *
 * 근거: 공휴일에 관한 법률 및 관공서의 공휴일에 관한 규정
 * (2026-05-11 시행본). 임시공휴일과 선거일은 사전에 확정할 수 없으므로
 * 포함하지 않으며, 그 한계는 일정 결과에 항상 표시합니다.
 */
export const KOREAN_BUSINESS_CALENDAR = {
  validFrom: "2025-01-01",
  validTo: "2040-12-31",
  reviewedAt: "2026-08-21",
  sourceUrls: [
    "https://www.law.go.kr/법령/공휴일에관한법률",
    "https://www.law.go.kr/법령/관공서의공휴일에관한규정",
  ],
  excluded: ["임시공휴일", "공직선거법상 선거일"],
} as const;

type LunarParts = { month: number; day: number };

const lunarFormatter = new Intl.DateTimeFormat("en-u-ca-chinese", {
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

function toDate(day: number) {
  return new Date(day * DAY_MS);
}

export function parseIsoDay(value: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(value);
  if (!match) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }
  return Math.floor(date.getTime() / DAY_MS);
}

export function formatIsoDay(day: number) {
  return toDate(day).toISOString().slice(0, 10);
}

function lunarParts(day: number): LunarParts {
  const parts = lunarFormatter.formatToParts(toDate(day));
  return {
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function fixedHolidayKey(day: number) {
  const date = toDate(day);
  const month = date.getUTCMonth() + 1;
  const dateOfMonth = date.getUTCDate();
  return `${month}-${dateOfMonth}`;
}

function rawHolidayLabels(day: number) {
  const labels: string[] = [];
  const year = toDate(day).getUTCFullYear();
  const key = fixedHolidayKey(day);
  const fixedLabels: Record<string, string> = {
    "1-1": "NEW_YEAR",
    "3-1": "INDEPENDENCE_MOVEMENT_DAY",
    "5-5": "CHILDRENS_DAY",
    "6-6": "MEMORIAL_DAY",
    "8-15": "LIBERATION_DAY",
    "10-3": "NATIONAL_FOUNDATION_DAY",
    "10-9": "HANGUL_DAY",
    "12-25": "CHRISTMAS",
  };
  if (fixedLabels[key]) labels.push(fixedLabels[key]);
  // 노동절·제헌절은 2026년 개정 법령부터 관공서 공휴일 및 대체공휴일 대상입니다.
  if (year >= 2026 && key === "5-1") labels.push("LABOR_DAY");
  if (year >= 2026 && key === "7-17") labels.push("CONSTITUTION_DAY");
  const lunar = lunarParts(day);
  const nextLunar = lunarParts(day + 1);
  const lunarNewYear =
    (nextLunar.month === 1 && nextLunar.day === 1) ||
    (lunar.month === 1 && (lunar.day === 1 || lunar.day === 2));
  const buddhasBirthday = lunar.month === 4 && lunar.day === 8;
  const chuseok = lunar.month === 8 && [14, 15, 16].includes(lunar.day);
  if (lunarNewYear) labels.push("LUNAR_NEW_YEAR");
  if (buddhasBirthday) labels.push("BUDDHAS_BIRTHDAY");
  if (chuseok) labels.push("CHUSEOK");
  return labels;
}

function isRawHoliday(day: number) {
  return rawHolidayLabels(day).length > 0;
}

function isWeekend(day: number) {
  const weekday = toDate(day).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function substituteHolidaySet(year: number) {
  const start = parseIsoDay(`${year}-01-01`)!;
  const end = parseIsoDay(`${year + 1}-01-01`)!;
  const raw = new Set<number>();
  for (let day = start - 7; day < end + 7; day += 1) {
    if (isRawHoliday(day)) raw.add(day);
  }
  const substitutes = new Set<number>();

  const addFirstOpenWeekday = (after: number) => {
    let candidate = after + 1;
    while (isWeekend(candidate) || raw.has(candidate) || substitutes.has(candidate)) {
      candidate += 1;
    }
    substitutes.add(candidate);
  };

  // 설·추석 연휴는 연휴 중 일요일 또는 다른 공휴일과 겹칠 때 한 번 대체합니다.
  for (const lunarMonth of [1, 8]) {
    const group = [...raw].filter((day) => {
      const lunar = lunarParts(day);
      if (lunarMonth === 1) {
        const next = lunarParts(day + 1);
        return (next.month === 1 && next.day === 1) || (lunar.month === 1 && [1, 2].includes(lunar.day));
      }
      return lunar.month === 8 && [14, 15, 16].includes(lunar.day);
    });
    if (group.length && group.some((day) => toDate(day).getUTCDay() === 0)) {
      addFirstOpenWeekday(Math.max(...group));
    }
  }

  // 국경일, 노동절, 어린이날, 부처님오신날, 기독탄신일은 토·일요일과 겹치면 대체합니다.
  for (const day of raw) {
    const key = fixedHolidayKey(day);
    const lunar = lunarParts(day);
    const eligible =
      ["3-1", "5-1", "5-5", "7-17", "8-15", "10-3", "10-9", "12-25"].includes(key) ||
      (lunar.month === 4 && lunar.day === 8);
    if (eligible && isWeekend(day)) addFirstOpenWeekday(day);
  }

  // 대체공휴일 대상인 서로 다른 공휴일이 같은 평일에 겹치는 경우도 다음 비공휴일을 둡니다.
  const substituteEligible = new Set([
    "INDEPENDENCE_MOVEMENT_DAY",
    "LABOR_DAY",
    "CHILDRENS_DAY",
    "CONSTITUTION_DAY",
    "LIBERATION_DAY",
    "NATIONAL_FOUNDATION_DAY",
    "HANGUL_DAY",
    "CHRISTMAS",
    "LUNAR_NEW_YEAR",
    "BUDDHAS_BIRTHDAY",
    "CHUSEOK",
  ]);
  for (const day of raw) {
    const eligibleLabels = rawHolidayLabels(day).filter((label) => substituteEligible.has(label));
    if (eligibleLabels.length >= 2 && !isWeekend(day)) addFirstOpenWeekday(day);
  }

  return substitutes;
}

const substitutesByYear = new Map<number, Set<number>>();

function substitutes(year: number) {
  const existing = substitutesByYear.get(year);
  if (existing) return existing;
  const generated = substituteHolidaySet(year);
  substitutesByYear.set(year, generated);
  return generated;
}

export function isCalendarCovered(day: number) {
  const minimum = parseIsoDay(KOREAN_BUSINESS_CALENDAR.validFrom)!;
  const maximum = parseIsoDay(KOREAN_BUSINESS_CALENDAR.validTo)!;
  return day >= minimum && day <= maximum;
}

export function isKoreanBusinessDay(day: number) {
  if (!isCalendarCovered(day) || isWeekend(day) || isRawHoliday(day)) return false;
  const year = toDate(day).getUTCFullYear();
  return !substitutes(year).has(day);
}

export function advanceBusinessDays(start: number, count: number) {
  if (!Number.isInteger(count) || count < 0 || !isCalendarCovered(start)) return null;
  let cursor = start;
  let remaining = count;
  while (remaining > 0) {
    if (!isCalendarCovered(cursor)) return null;
    if (isKoreanBusinessDay(cursor)) remaining -= 1;
    cursor += 1;
  }
  return isCalendarCovered(Math.max(start, cursor - 1)) ? cursor : null;
}

export function rewindBusinessDays(finish: number, count: number) {
  if (!Number.isInteger(count) || count < 0 || !isCalendarCovered(finish - (count ? 1 : 0))) return null;
  let cursor = finish;
  let remaining = count;
  while (remaining > 0) {
    cursor -= 1;
    if (!isCalendarCovered(cursor)) return null;
    if (isKoreanBusinessDay(cursor)) remaining -= 1;
  }
  return cursor;
}
