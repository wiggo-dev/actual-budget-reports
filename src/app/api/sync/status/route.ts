import { readSyncStatus } from "@/lib/actual/client";
import { withActual } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withActual(async () => readSyncStatus());
}
