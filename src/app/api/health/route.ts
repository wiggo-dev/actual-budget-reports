import { NextResponse } from "next/server";

import { buildHealthPayload } from "@/lib/actual/health";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildHealthPayload());
}
