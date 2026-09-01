import { describe, expect, it } from "vitest";

import { parseReportRange } from "@/lib/reports/filters";
import {
  calendarMonthsBetween,
  customRangeError,
  dateBoundsForRange,
  isValidCustomRange,
  monthStartsForRange,
  parseCustomDateRange,
} from "@/lib/reports/report-range";

describe("parseCustomDateRange", () => {
  it("accepts valid inclusive ranges", () => {
    expect(parseCustomDateRange("2026-01-15", "2026-03-20")).toEqual({
      start: "2026-01-15",
      end: "2026-03-20",
    });
  });

  it("rejects end before start", () => {
    expect(parseCustomDateRange("2026-03-01", "2026-02-01")).toBeNull();
  });
});

describe("monthStartsForRange", () => {
  it("covers each calendar month in a custom range", () => {
    const months = monthStartsForRange({
      kind: "custom",
      range: { start: "2026-01-15", end: "2026-03-10" },
    });

    expect(months.map((month) => month.getMonth())).toEqual([0, 1, 2]);
  });
});

describe("dateBoundsForRange", () => {
  it("returns the custom bounds unchanged", () => {
    expect(
      dateBoundsForRange({
        kind: "custom",
        range: { start: "2025-04-06", end: "2026-04-05" },
      })
    ).toEqual({ start: "2025-04-06", end: "2026-04-05" });
  });
});

describe("parseReportRange", () => {
  it("prefers start/end query params over timeframe presets", () => {
    expect(
      parseReportRange(
        new URLSearchParams("start=2026-01-01&end=2026-02-28&timeframe=12m")
      )
    ).toEqual({
      kind: "custom",
      range: { start: "2026-01-01", end: "2026-02-28" },
    });
  });
});

describe("customRangeError", () => {
  it("flags invalid ranges for the UI", () => {
    expect(
      customRangeError({ start: "2026-03-01", end: "2026-02-01" })
    ).toMatch(/on or after/i);
    expect(isValidCustomRange({ start: "2026-01-01", end: "2026-02-01" })).toBe(
      true
    );
  });
});

describe("calendarMonthsBetween", () => {
  it("includes both endpoint months", () => {
    expect(calendarMonthsBetween("2026-01-31", "2026-02-01")).toHaveLength(2);
  });
});
