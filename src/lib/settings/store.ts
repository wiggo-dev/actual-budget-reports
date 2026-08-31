import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { getEnv } from "@/lib/env";
import {
  defaultSettings,
  settingsSchema,
  type Settings,
} from "@/lib/settings/types";

async function ensureParentDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function readSettings(): Promise<Settings> {
  const { SETTINGS_PATH } = getEnv();

  try {
    const raw = await readFile(SETTINGS_PATH, "utf8");
    return settingsSchema.parse(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

export async function writeSettings(settings: Settings): Promise<Settings> {
  const { SETTINGS_PATH } = getEnv();
  const parsed = settingsSchema.parse(settings);
  await ensureParentDir(SETTINGS_PATH);
  await writeFile(SETTINGS_PATH, JSON.stringify(parsed, null, 2));
  return parsed;
}
