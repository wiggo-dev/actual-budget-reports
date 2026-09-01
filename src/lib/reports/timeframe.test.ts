import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  dateRangeForWindow,
  monthsInWindow,
  parseTimeframeValue,
  timeframeWindow,
} from "@/lib/reports/timeframe";

describe("parseTimeframeValue", () => {
  it("accepts known timeframe ids and rejects unknown values", () => {
    expect(parseTimeframeValue("3m")).toBe("3m");
    expect(parseTimeframeValue("this-month")).toBe("this-month");
    expect(parseTimeframeValue("bogus")).toBeNull();
    expect(parseTimeframeValue(null)).toBeNull();
  });
});

describe("timeframeWindow", () => {
  it("falls back to 12 months for unknown ids", () => {
    expect(timeframeWindow("12m" as never)).toEqual({
      count: 12,
      endOffset: 0,
    });
  });
});

describe("monthsInWindow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns calendar months ending this month", () => {
    expect(
      monthsInWindow({ count: 3, endOffset: 0 }).map((d) => d.getMonth())
    ).toEqual([0, 1, 2]);
  });

  it("shifts the window end when endOffset is set", () => {
    expect(
      monthsInWindow({ count: 1, endOffset: 1 }).map((d) => d.getMonth())
    ).toEqual([1]);
  });
});

describe("dateRangeForWindow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("covers the first and last day of the window months", () => {
    expect(dateRangeForWindow({ count: 2, endOffset: 0 })).toEqual({
      start: "2026-02-01",
      end: "2026-03-31",
    });
  });

  it("handles last-month windows", () => {
    expect(dateRangeForWindow({ count: 1, endOffset: 1 })).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });
});
