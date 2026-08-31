import { formatLocalDate } from "@/lib/format";

export type Timeframe =
  "this-month" | "last-month" | "2m" | "3m" | "6m" | "12m" | "24m" | "all";

export type MonthWindow = {
  /** Number of calendar months in the window. */
  count: number;
  /** Shift the window end into the past (0 = ends this month). */
  endOffset: number;
};

export const TIMEFRAMES: {
  id: Timeframe;
  label: string;
  window: MonthWindow;
}[] = [
  { id: "this-month", label: "This month", window: { count: 1, endOffset: 0 } },
  { id: "last-month", label: "Last month", window: { count: 1, endOffset: 1 } },
  { id: "2m", label: "Last 2 months", window: { count: 2, endOffset: 0 } },
  { id: "3m", label: "3 months", window: { count: 3, endOffset: 0 } },
  { id: "6m", label: "6 months", window: { count: 6, endOffset: 0 } },
  { id: "12m", label: "12 months", window: { count: 12, endOffset: 0 } },
  { id: "24m", label: "24 months", window: { count: 24, endOffset: 0 } },
  { id: "all", label: "All time", window: { count: 120, endOffset: 0 } },
];

export function timeframeWindow(timeframe: Timeframe): MonthWindow {
  return (
    TIMEFRAMES.find((item) => item.id === timeframe)?.window ?? {
      count: 12,
      endOffset: 0,
    }
  );
}

/** Count of months for query strings / legacy callers. */
export function timeframeMonths(timeframe: Timeframe): number {
  return timeframeWindow(timeframe).count;
}

export function timeframeLabel(timeframe: Timeframe): string {
  return TIMEFRAMES.find((item) => item.id === timeframe)?.label ?? "12 months";
}

export function parseTimeframe(searchParams: URLSearchParams): Timeframe {
  return parseTimeframeValue(searchParams.get("timeframe")) ?? "12m";
}

export function parseTimeframeValue(value: string | null): Timeframe | null {
  if (value && TIMEFRAMES.some((item) => item.id === value)) {
    return value as Timeframe;
  }
  return null;
}

/** Calendar months covered by a window, oldest → newest. */
export function monthsInWindow(window: MonthWindow): Date[] {
  const now = new Date();
  const endMonth = new Date(
    now.getFullYear(),
    now.getMonth() - window.endOffset,
    1
  );
  const months: Date[] = [];

  for (let i = window.count - 1; i >= 0; i -= 1) {
    months.push(new Date(endMonth.getFullYear(), endMonth.getMonth() - i, 1));
  }

  return months;
}

export function dateRangeForWindow(window: MonthWindow): {
  start: string;
  end: string;
} {
  const months = monthsInWindow(window);
  const first = months[0]!;
  const last = months[months.length - 1]!;
  const end = new Date(last.getFullYear(), last.getMonth() + 1, 0);

  return {
    start: formatLocalDate(first),
    end: formatLocalDate(end),
  };
}
