import { formatLocalDate } from "@/lib/format";
import {
  dateRangeForWindow,
  monthsInWindow,
  type MonthWindow,
} from "@/lib/reports/timeframe";

export type CustomDateRange = {
  start: string;
  end: string;
};

export type ReportRange =
  | { kind: "preset"; window: MonthWindow }
  | { kind: "custom"; range: CustomDateRange };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isValidCustomRange(range: CustomDateRange): boolean {
  return (
    isValidDateString(range.start) &&
    isValidDateString(range.end) &&
    range.start <= range.end
  );
}

export function parseCustomDateRange(
  start: string | null,
  end: string | null
): CustomDateRange | null {
  if (!start || !end) {
    return null;
  }

  const range = { start, end };
  return isValidCustomRange(range) ? range : null;
}

export function calendarMonthsBetween(start: string, end: string): Date[] {
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  const months: Date[] = [];
  let year = startYear!;
  let month = startMonth! - 1;
  const endIndex = endYear! * 12 + (endMonth! - 1);

  while (year * 12 + month <= endIndex) {
    months.push(new Date(year, month, 1));
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return months;
}

export function monthStartsForRange(range: ReportRange): Date[] {
  if (range.kind === "preset") {
    return monthsInWindow(range.window);
  }

  return calendarMonthsBetween(range.range.start, range.range.end);
}

export function dateBoundsForRange(range: ReportRange): CustomDateRange {
  if (range.kind === "custom") {
    return range.range;
  }

  return dateRangeForWindow(range.window);
}

export function formatCustomRangeLabel(range: CustomDateRange): string {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function defaultCustomRange(now = new Date()): CustomDateRange {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end),
  };
}

export function customRangeError(range: CustomDateRange | null): string | null {
  if (!range?.start || !range.end) {
    return "Choose a start and end date.";
  }
  if (!isValidDateString(range.start) || !isValidDateString(range.end)) {
    return "Use valid calendar dates.";
  }
  if (range.start > range.end) {
    return "End date must be on or after the start date.";
  }
  return null;
}
