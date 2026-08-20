import { describe, expect, it } from "vitest";

import {
  KOREAN_BUSINESS_CALENDAR,
  advanceBusinessDays,
  formatIsoDay,
  isCalendarCovered,
  isKoreanBusinessDay,
  parseIsoDay,
  rewindBusinessDays,
} from "@/lib/calendar/korean-business-calendar";

function day(value: string) {
  const parsed = parseIsoDay(value);
  if (parsed === null) throw new Error(`invalid test date: ${value}`);
  return parsed;
}

describe("reviewed Korean business calendar", () => {
  it("publishes its reviewed range and official source metadata", () => {
    expect(KOREAN_BUSINESS_CALENDAR.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(KOREAN_BUSINESS_CALENDAR.sourceUrls).not.toHaveLength(0);
    expect(
      KOREAN_BUSINESS_CALENDAR.sourceUrls.every((url) =>
        url.startsWith("https://www.law.go.kr/"),
      ),
    ).toBe(true);
    expect(isCalendarCovered(day(KOREAN_BUSINESS_CALENDAR.validFrom))).toBe(true);
    expect(isCalendarCovered(day(KOREAN_BUSINESS_CALENDAR.validTo))).toBe(true);
    expect(isCalendarCovered(day(KOREAN_BUSINESS_CALENDAR.validFrom) - 1)).toBe(false);
    expect(isCalendarCovered(day(KOREAN_BUSINESS_CALENDAR.validTo) + 1)).toBe(false);
  });

  it("rejects malformed or impossible ISO dates", () => {
    expect(parseIsoDay("2026-13-01")).toBeNull();
    expect(parseIsoDay("2026-02-30")).toBeNull();
    expect(parseIsoDay("2028-02-29")).not.toBeNull();
  });

  it("excludes weekends, fixed holidays, lunar holidays and substitutes", () => {
    expect(isKoreanBusinessDay(day("2025-01-01"))).toBe(false);
    expect(isKoreanBusinessDay(day("2025-05-01"))).toBe(true);
    expect(isKoreanBusinessDay(day("2025-07-17"))).toBe(true);
    expect(isKoreanBusinessDay(day("2026-01-01"))).toBe(false);
    expect(isKoreanBusinessDay(day("2026-01-02"))).toBe(true);
    expect(isKoreanBusinessDay(day("2026-01-03"))).toBe(false);
    expect(isKoreanBusinessDay(day("2026-02-16"))).toBe(false);
    expect(isKoreanBusinessDay(day("2026-02-17"))).toBe(false);
    expect(isKoreanBusinessDay(day("2026-02-18"))).toBe(false);
    expect(isKoreanBusinessDay(day("2026-03-02"))).toBe(false);
    expect(isKoreanBusinessDay(day("2026-05-01"))).toBe(false);
    expect(isKoreanBusinessDay(day("2026-07-17"))).toBe(false);
    expect(isKoreanBusinessDay(day("2027-05-03"))).toBe(false);
    expect(isKoreanBusinessDay(day("2027-07-19"))).toBe(false);
  });

  it("advances and rewinds using exclusive finish boundaries", () => {
    const start = day("2026-01-02");
    const oneDayFinish = advanceBusinessDays(start, 1);
    const twoDayFinish = advanceBusinessDays(start, 2);

    expect(oneDayFinish === null ? null : formatIsoDay(oneDayFinish)).toBe(
      "2026-01-03",
    );
    expect(twoDayFinish === null ? null : formatIsoDay(twoDayFinish)).toBe(
      "2026-01-06",
    );
    expect(
      twoDayFinish === null
        ? null
        : formatIsoDay(rewindBusinessDays(twoDayFinish, 2)!),
    ).toBe("2026-01-02");
  });

  it("skips the Lunar New Year closure without approximating calendar days", () => {
    const finish = advanceBusinessDays(day("2026-02-13"), 2);
    expect(finish === null ? null : formatIsoDay(finish)).toBe("2026-02-20");
  });

  it("keeps immediate processing at the same boundary and rejects uncovered spans", () => {
    const start = day("2026-01-02");
    expect(advanceBusinessDays(start, 0)).toBe(start);
    expect(rewindBusinessDays(start, 0)).toBe(start);
    expect(advanceBusinessDays(day("2040-12-31"), 2)).toBeNull();
  });
});
