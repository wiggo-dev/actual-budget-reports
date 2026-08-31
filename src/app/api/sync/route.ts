import { forceSync } from "@/lib/actual/client";
import { withActual } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  return withActual(async () => forceSync());
}
