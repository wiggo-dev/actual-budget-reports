import { NextResponse } from "next/server";

import { isActualConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    actualConfigured: isActualConfigured(),
  });
}
