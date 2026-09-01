import { jsonError } from "@/lib/api";
import { buildHealthPayload } from "@/lib/actual/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await buildHealthPayload());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Health check failed";
    return jsonError(message, 500);
  }
}
