import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { parseExcludedIds, parseReportRange } from "@/lib/reports/filters";
import { getPayeeSpending } from "@/lib/reports/payee-spending";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const excludedAccountIds = parseExcludedIds(request.nextUrl.searchParams);
  const range = parseReportRange(request.nextUrl.searchParams, 1);

  return withActual(async () => {
    await syncIfNeeded();
    return getPayeeSpending(excludedAccountIds, range);
  });
}
