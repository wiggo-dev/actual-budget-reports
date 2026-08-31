export type Timeframe = "3m" | "6m" | "12m" | "24m" | "all";

export const TIMEFRAMES: {
  id: Timeframe;
  label: string;
  months: number | null;
}[] = [
  { id: "3m", label: "3 months", months: 3 },
  { id: "6m", label: "6 months", months: 6 },
  { id: "12m", label: "12 months", months: 12 },
  { id: "24m", label: "24 months", months: 24 },
  { id: "all", label: "All time", months: null },
];

export function timeframeMonths(timeframe: Timeframe): number {
  const found = TIMEFRAMES.find((item) => item.id === timeframe);
  if (!found || found.months == null) {
    return 120;
  }
  return found.months;
}

export function timeframeLabel(timeframe: Timeframe): string {
  return TIMEFRAMES.find((item) => item.id === timeframe)?.label ?? "12 months";
}

export function parseTimeframe(searchParams: URLSearchParams): Timeframe {
  const value = searchParams.get("timeframe");
  if (value && TIMEFRAMES.some((item) => item.id === value)) {
    return value as Timeframe;
  }
  return "12m";
}
