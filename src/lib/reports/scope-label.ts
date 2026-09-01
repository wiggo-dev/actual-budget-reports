import type { CustomDateRange } from "@/lib/reports/report-range";
import {
  formatCustomRangeLabel,
  isValidCustomRange,
} from "@/lib/reports/report-range";
import { timeframeLabel, type Timeframe } from "@/lib/reports/timeframe";

export function scopeLabel(
  timeframe: Timeframe,
  customRange: CustomDateRange | null
): string {
  if (
    timeframe === "custom" &&
    customRange &&
    isValidCustomRange(customRange)
  ) {
    return formatCustomRangeLabel(customRange);
  }
  return timeframeLabel(timeframe);
}
