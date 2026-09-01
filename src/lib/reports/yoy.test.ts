import { describe, expect, it } from "vitest";

import {
  mergeYoYSeries,
  monthShortLabel,
  priorYearScope,
  shiftCustomRangeBackOneYear,
  yoyHelpText,
} from "@/lib/reports/yoy";

describe("shiftCustomRangeBackOneYear", () => {
  it("shifts both bounds back one year", () => {
    expect(
      shiftCustomRangeBackOneYear({ start: "2025-03-01", end: "2025-08-31" })
    ).toEqual({ start: "2024-03-01", end: "2024-08-31" });
  });
});

describe("priorYearScope", () => {
  it("derives a shifted custom range from preset timeframes", () => {
    const scope = priorYearScope("6m", null);
    expect(scope.timeframe).toBe("custom");
    expect(scope.customRange.start.slice(0, 4)).toBe(
      String(new Date().getFullYear() - 1)
    );
  });
});

describe("mergeYoYSeries", () => {
  it("aligns months by calendar month and preserves missing prior values", () => {
    const merged = mergeYoYSeries(
      [
        { month: "2025-01", netWorth: 1000 },
        { month: "2025-02", netWorth: 1100 },
      ],
      [{ month: "2024-01", netWorth: 900 }],
      ["netWorth"]
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      month: monthShortLabel("2025-01"),
      netWorthCurrent: 1000,
      netWorthPrior: 900,
    });
    expect(merged[1]).toMatchObject({
      netWorthCurrent: 1100,
      netWorthPrior: null,
    });
  });
});

describe("yoyHelpText", () => {
  it("mentions the active scope label", () => {
    expect(yoyHelpText("Last 6 months")).toContain("last 6 months");
  });
});
