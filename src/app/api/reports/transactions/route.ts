import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { parseExcludedIds, parseReportRange } from "@/lib/reports/filters";
import { getFilteredTransactions } from "@/lib/reports/payee-spending";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const excludedAccountIds = parseExcludedIds(params);
  const range = parseReportRange(params, 1);

  return withActual(async () => {
    await syncIfNeeded();
    return getFilteredTransactions(excludedAccountIds, range, {
      payeeId: params.get("payeeId"),
      payeeName: params.get("payee"),
      category: params.get("category"),
      month: params.get("month"),
    });
  });
}
