import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { getSpendingByCategory } from "@/lib/reports/spending-by-category";
import { parseExcludedIds, parseReportWindow } from "@/lib/reports/filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const excludedAccountIds = parseExcludedIds(request.nextUrl.searchParams);
  const window = parseReportWindow(request.nextUrl.searchParams, 1);

  return withActual(async () => {
    await syncIfNeeded();
    return getSpendingByCategory(excludedAccountIds, window);
  });
}
