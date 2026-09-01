import { dashboardViews, type DashboardView } from "@/lib/dashboard-views";
import {
  parseCustomDateRange,
  type CustomDateRange,
} from "@/lib/reports/report-range";
import { parseTimeframeValue, type Timeframe } from "@/lib/reports/timeframe";

export type DashboardUrlState = {
  view: DashboardView;
  trend: Timeframe;
  spending: Timeframe;
  trendCustom: CustomDateRange | null;
  spendingCustom: CustomDateRange | null;
  presetId: string | null;
  excludedAccountIds: string[] | null;
};

export function parseDashboardView(value: string | null): DashboardView | null {
  if (value && dashboardViews.some((view) => view.id === value)) {
    return value as DashboardView;
  }
  return null;
}

function parseScopeFromUrl(
  prefix: "trend" | "spending",
  searchParams: URLSearchParams
): { timeframe: Timeframe | null; custom: CustomDateRange | null } {
  const raw = searchParams.get(prefix);
  const timeframe = parseTimeframeValue(raw);
  if (raw === "custom") {
    return {
      timeframe: "custom",
      custom: parseCustomDateRange(
        searchParams.get(`${prefix}Start`),
        searchParams.get(`${prefix}End`)
      ),
    };
  }

  return { timeframe, custom: null };
}

export function readDashboardUrlState(
  searchParams: URLSearchParams
): Partial<DashboardUrlState> {
  const view = parseDashboardView(searchParams.get("view"));
  const trendScope = parseScopeFromUrl("trend", searchParams);
  const spendingScope = parseScopeFromUrl("spending", searchParams);
  const presetId = searchParams.get("preset");
  const excludedRaw = searchParams.get("excluded");

  const state: Partial<DashboardUrlState> = {};
  if (view) state.view = view;
  if (trendScope.timeframe) state.trend = trendScope.timeframe;
  if (trendScope.custom) state.trendCustom = trendScope.custom;
  if (spendingScope.timeframe) state.spending = spendingScope.timeframe;
  if (spendingScope.custom) state.spendingCustom = spendingScope.custom;
  if (presetId) state.presetId = presetId;
  if (excludedRaw != null) {
    state.excludedAccountIds = excludedRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return state;
}

export function buildDashboardSearchParams(input: {
  view: DashboardView;
  trend: Timeframe;
  spending: Timeframe;
  trendCustom: CustomDateRange | null;
  spendingCustom: CustomDateRange | null;
  presetId: string | null;
  excludedAccountIds: string[];
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("view", input.view);
  params.set("trend", input.trend);
  params.set("spending", input.spending);

  if (input.trend === "custom" && input.trendCustom) {
    params.set("trendStart", input.trendCustom.start);
    params.set("trendEnd", input.trendCustom.end);
  }
  if (input.spending === "custom" && input.spendingCustom) {
    params.set("spendingStart", input.spendingCustom.start);
    params.set("spendingEnd", input.spendingCustom.end);
  }

  if (input.presetId) {
    params.set("preset", input.presetId);
  } else if (input.excludedAccountIds.length > 0) {
    params.set("excluded", input.excludedAccountIds.join(","));
  }

  return params;
}
