import { mkdir } from "node:fs/promises";

import * as actual from "@actual-app/api";

import { getEnv, isActualConfigured } from "@/lib/env";

let initPromise: Promise<void> | null = null;
let lastSyncAt = 0;

function budgetDownloadOptions() {
  const { ACTUAL_E2E_PASSWORD } = getEnv();
  if (ACTUAL_E2E_PASSWORD?.trim()) {
    return { password: ACTUAL_E2E_PASSWORD };
  }
  return undefined;
}

export async function ensureActualReady(): Promise<void> {
  if (!isActualConfigured()) {
    throw new Error(
      "Actual Budget is not configured. Set ACTUAL_SERVER_URL, ACTUAL_SERVER_PASSWORD, and ACTUAL_SYNC_ID."
    );
  }

  if (!initPromise) {
    initPromise = initializeActual().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  await initPromise;
}

async function initializeActual(): Promise<void> {
  const env = getEnv();
  const serverURL = env.ACTUAL_SERVER_URL!;
  const password = env.ACTUAL_SERVER_PASSWORD!;

  await mkdir(env.ACTUAL_DATA_DIR, { recursive: true });

  try {
    await actual.init({
      dataDir: env.ACTUAL_DATA_DIR,
      serverURL,
      password,
    });

    await actual.downloadBudget(env.ACTUAL_SYNC_ID!, budgetDownloadOptions());
    await actual.sync();
    lastSyncAt = Date.now();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to connect to Actual Budget";
    throw new Error(
      `${message}. Check ACTUAL_SERVER_URL (use http://localhost:5006 for local dev), credentials, and that actual-server is running.`
    );
  }
}

export async function syncIfNeeded(
  force = false
): Promise<{ syncedAt: number }> {
  await ensureActualReady();
  const { SYNC_INTERVAL_MS } = getEnv();
  const now = Date.now();

  if (force || now - lastSyncAt >= SYNC_INTERVAL_MS) {
    await actual.sync();
    lastSyncAt = now;
  }

  return { syncedAt: lastSyncAt };
}

export async function forceSync(): Promise<{ syncedAt: number }> {
  return syncIfNeeded(true);
}

export function getSyncStatus(): {
  syncedAt: number | null;
  syncIntervalMs: number;
} {
  const { SYNC_INTERVAL_MS } = getEnv();
  return {
    syncedAt: lastSyncAt > 0 ? lastSyncAt : null,
    syncIntervalMs: SYNC_INTERVAL_MS,
  };
}

export async function readSyncStatus(): Promise<{
  syncedAt: number;
  syncIntervalMs: number;
}> {
  await ensureActualReady();
  const { SYNC_INTERVAL_MS } = getEnv();
  return {
    syncedAt: lastSyncAt,
    syncIntervalMs: SYNC_INTERVAL_MS,
  };
}

export async function getBudgetPreferences() {
  await ensureActualReady();
  return actual.getPreferences();
}

export { actual };
