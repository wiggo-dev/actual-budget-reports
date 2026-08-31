import { NextResponse } from "next/server";

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function withActual<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  try {
    const data = await handler();
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return jsonError(message, message.includes("not configured") ? 503 : 500);
  }
}
