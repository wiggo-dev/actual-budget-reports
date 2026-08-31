import { dashboardViews, type DashboardView } from "@/lib/dashboard-views";
import { parseTimeframeValue, type Timeframe } from "@/lib/reports/timeframe";

export type DashboardUrlState = {
  view: DashboardView;
  trend: Timeframe;
  spending: Timeframe;
  presetId: string | null;
  excludedAccountIds: string[] | null;
};

export function parseDashboardView(value: string | null): DashboardView | null {
  if (value && dashboardViews.some((view) => view.id === value)) {
    return value as DashboardView;
  }
  return null;
}

export function readDashboardUrlState(
  searchParams: URLSearchParams
): Partial<DashboardUrlState> {
  const view = parseDashboardView(searchParams.get("view"));
  const trend = parseTimeframeValue(searchParams.get("trend"));
  const spending = parseTimeframeValue(searchParams.get("spending"));
  const presetId = searchParams.get("preset");
  const excludedRaw = searchParams.get("excluded");

  const state: Partial<DashboardUrlState> = {};
  if (view) state.view = view;
  if (trend) state.trend = trend;
  if (spending) state.spending = spending;
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
  presetId: string | null;
  excludedAccountIds: string[];
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("view", input.view);
  params.set("trend", input.trend);
  params.set("spending", input.spending);

  if (input.presetId) {
    params.set("preset", input.presetId);
  } else if (input.excludedAccountIds.length > 0) {
    params.set("excluded", input.excludedAccountIds.join(","));
  }

  return params;
}
