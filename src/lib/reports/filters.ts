import {
  parseTimeframe,
  timeframeWindow,
  type MonthWindow,
} from "@/lib/reports/timeframe";
import {
  parseCustomDateRange,
  type ReportRange,
} from "@/lib/reports/report-range";

export type ReportAccount = {
  id: string;
  name: string;
  offbudget?: boolean;
  closed?: boolean;
};

export function filterAccounts(
  accounts: ReportAccount[],
  excludedAccountIds: string[]
): ReportAccount[] {
  const excluded = new Set(excludedAccountIds);
  return accounts.filter((account) => !excluded.has(account.id));
}

export function parseExcludedIds(searchParams: URLSearchParams): string[] {
  const repeated = searchParams.getAll("excludedAccountIds");
  if (repeated.length > 0) {
    return repeated;
  }

  const csv = searchParams.get("excluded");
  if (!csv) {
    return [];
  }

  return csv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function parseMonths(
  searchParams: URLSearchParams,
  fallback = 12
): number {
  return parseReportWindow(searchParams, fallback).count;
}

export function parseReportRange(
  searchParams: URLSearchParams,
  fallbackMonths = 12
): ReportRange {
  const custom = parseCustomDateRange(
    searchParams.get("start"),
    searchParams.get("end")
  );
  if (custom) {
    return { kind: "custom", range: custom };
  }

  return {
    kind: "preset",
    window: parseReportWindow(searchParams, fallbackMonths),
  };
}

export function parseReportWindow(
  searchParams: URLSearchParams,
  fallbackMonths = 12
): MonthWindow {
  if (searchParams.has("timeframe")) {
    return timeframeWindow(parseTimeframe(searchParams));
  }

  const raw = searchParams.get("months");
  if (!raw) {
    return { count: fallbackMonths, endOffset: 0 };
  }

  if (raw === "all") {
    return { count: 120, endOffset: 0 };
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { count: fallbackMonths, endOffset: 0 };
  }

  return { count: Math.min(parsed, 120), endOffset: 0 };
}
