import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { getNetWorthSeries } from "@/lib/reports/net-worth";
import { parseExcludedIds, parseMonths } from "@/lib/reports/filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const excludedAccountIds = parseExcludedIds(request.nextUrl.searchParams);
  const months = parseMonths(request.nextUrl.searchParams);

  return withActual(async () => {
    await syncIfNeeded();
    return getNetWorthSeries(excludedAccountIds, months);
  });
}
