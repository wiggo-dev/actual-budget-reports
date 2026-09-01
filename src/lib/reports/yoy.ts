import type { CustomDateRange } from "@/lib/reports/report-range";
import type { ReportRange } from "@/lib/reports/report-range";
import {
  dateRangeForWindow,
  timeframeWindow,
  type Timeframe,
} from "@/lib/reports/timeframe";

export function shiftDateBackOneYear(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year! - 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function shiftCustomRangeBackOneYear(
  range: CustomDateRange
): CustomDateRange {
  return {
    start: shiftDateBackOneYear(range.start),
    end: shiftDateBackOneYear(range.end),
  };
}

export function scopeToCustomRange(
  timeframe: Timeframe,
  customRange: CustomDateRange | null
): CustomDateRange {
  if (timeframe === "custom" && customRange) {
    return customRange;
  }

  return dateRangeForWindow(timeframeWindow(timeframe));
}

export function priorYearScope(
  timeframe: Timeframe,
  customRange: CustomDateRange | null
): { timeframe: "custom"; customRange: CustomDateRange } {
  return {
    timeframe: "custom",
    customRange: shiftCustomRangeBackOneYear(
      scopeToCustomRange(timeframe, customRange)
    ),
  };
}

export function monthDayKey(month: string): string {
  return month.slice(5);
}

export function monthShortLabel(month: string): string {
  const [year, monthPart] = month.split("-").map(Number);
  const date = new Date(year!, monthPart! - 1, 1);
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
}

export function monthShortLabelWithYear(month: string): string {
  const [year, monthPart] = month.split("-").map(Number);
  const date = new Date(year!, monthPart! - 1, 1);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
  }).format(date);
}

type MonthKeyedRow = { month: string };

export function mergeYoYSeries<
  TCurrent extends MonthKeyedRow,
  TPrior extends MonthKeyedRow,
  TKey extends Exclude<keyof TCurrent, "month">,
>(
  current: TCurrent[],
  prior: TPrior[],
  keys: TKey[]
): Array<
  {
    month: string;
    monthKey: string;
  } & Record<`${string & TKey}Current`, number | null> &
    Record<`${string & TKey}Prior`, number | null>
> {
  const priorByMonthDay = new Map(
    prior.map((point) => [monthDayKey(point.month), point])
  );

  return current.map((point) => {
    const priorPoint = priorByMonthDay.get(monthDayKey(point.month));
    const row: Record<string, string | number | null> = {
      month: monthShortLabel(point.month),
      monthKey: point.month,
    };

    for (const key of keys) {
      const currentValue = point[key];
      const priorValue = priorPoint?.[key as keyof TPrior];
      row[`${String(key)}Current`] =
        typeof currentValue === "number" ? currentValue : null;
      row[`${String(key)}Prior`] =
        typeof priorValue === "number" ? priorValue : null;
    }

    return row as {
      month: string;
      monthKey: string;
    } & Record<`${string & TKey}Current`, number | null> &
      Record<`${string & TKey}Prior`, number | null>;
  });
}

export function yoyHelpText(scopeLabel: string): string {
  return `Compares each month in ${scopeLabel.toLowerCase()} with the same calendar month one year earlier. Account and category filters still apply.`;
}

export function reportRangeForScope(
  timeframe: Timeframe,
  customRange: CustomDateRange | null
): ReportRange {
  if (timeframe === "custom" && customRange) {
    return { kind: "custom", range: customRange };
  }

  return {
    kind: "preset",
    window: timeframeWindow(timeframe),
  };
}
