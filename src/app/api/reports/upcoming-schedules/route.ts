import type { NextRequest } from "next/server";

import { syncIfNeeded } from "@/lib/actual/client";
import { withActual } from "@/lib/api";
import { parseExcludedIds } from "@/lib/reports/filters";
import { getUpcomingSchedules } from "@/lib/reports/upcoming-schedules";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const excludedAccountIds = parseExcludedIds(request.nextUrl.searchParams);
  const horizonRaw = request.nextUrl.searchParams.get("days");
  const horizonDays = horizonRaw ? Number.parseInt(horizonRaw, 10) : 30;

  return withActual(async () => {
    await syncIfNeeded();
    return getUpcomingSchedules(
      excludedAccountIds,
      Number.isFinite(horizonDays) && horizonDays > 0 ? horizonDays : 30
    );
  });
}
