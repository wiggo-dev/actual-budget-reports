import { readSettings, writeSettings } from "@/lib/settings/store";
import { settingsSchema } from "@/lib/settings/types";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await readSettings();
  return Response.json({ data: settings });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const settings = settingsSchema.parse(body);
    const saved = await writeSettings(settings);
    return Response.json({ data: saved });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid settings payload";
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    const status =
      code === "EACCES" || code === "EPERM" || code === "EROFS" ? 500 : 400;
    return jsonError(message, status);
  }
}
