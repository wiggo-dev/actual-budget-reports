import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { getSpendingByCategory } from "@/lib/reports/spending-by-category";
import { parseExcludedIds, parseMonths } from "@/lib/reports/filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const excludedAccountIds = parseExcludedIds(request.nextUrl.searchParams);
  // Spending defaults to the selected timeframe; 12m overview still makes sense.
  const months = parseMonths(request.nextUrl.searchParams, 1);

  return withActual(async () => {
    await syncIfNeeded();
    return getSpendingByCategory(excludedAccountIds, months);
  });
}
