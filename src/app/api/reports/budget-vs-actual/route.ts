import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { getBudgetVsActual } from "@/lib/reports/budget-vs-actual";
import { parseExcludedIds } from "@/lib/reports/filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const excludedAccountIds = parseExcludedIds(request.nextUrl.searchParams);

  return withActual(async () => {
    await syncIfNeeded();
    return getBudgetVsActual(excludedAccountIds);
  });
}
