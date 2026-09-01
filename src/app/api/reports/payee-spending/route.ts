import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { parseReportFilters, parseReportRange } from "@/lib/reports/filters";
import { getPayeeSpending } from "@/lib/reports/payee-spending";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const filters = parseReportFilters(request.nextUrl.searchParams);
  const range = parseReportRange(request.nextUrl.searchParams, 1);

  return withActual(async () => {
    await syncIfNeeded();
    return getPayeeSpending(filters, range);
  });
}
