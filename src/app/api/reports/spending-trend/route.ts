import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { getSpendingByCategoryTrend } from "@/lib/reports/spending-by-category";
import { parseReportFilters, parseReportRange } from "@/lib/reports/filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const filters = parseReportFilters(request.nextUrl.searchParams);
  const range = parseReportRange(request.nextUrl.searchParams, 12);

  return withActual(async () => {
    await syncIfNeeded();
    return getSpendingByCategoryTrend(filters, range);
  });
}
