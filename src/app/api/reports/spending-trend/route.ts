import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { getSpendingByCategoryTrend } from "@/lib/reports/spending-by-category";
import { parseReportFilters, parseReportRange } from "@/lib/reports/filters";
import {
  parseSpendingAggregation,
  parseSpendingGroupId,
} from "@/lib/reports/spending-aggregation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = parseReportFilters(params);
  const range = parseReportRange(params, 12);

  return withActual(async () => {
    await syncIfNeeded();
    return getSpendingByCategoryTrend(filters, range, 7, {
      aggregation: parseSpendingAggregation(params),
      groupId: parseSpendingGroupId(params),
    });
  });
}
