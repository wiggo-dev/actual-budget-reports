import "server-only";

import { getActualApiVersion } from "@/lib/actual/api-version.server";
import { getSyncStatus } from "@/lib/actual/client";
import {
  compareActualVersions,
  fetchActualServerVersion,
} from "@/lib/actual/versions";
import { getEnv, isActualConfigured } from "@/lib/env";
import { isSyncStale } from "@/lib/sync-display";

export type HealthSyncState = "never" | "ok" | "stale";

export type HealthPayload =
  | {
      status: "ok";
      actualConfigured: false;
    }
  | {
      status: "ok";
      actualConfigured: true;
      sync: {
        syncedAt: number | null;
        syncIntervalMs: number;
        state: HealthSyncState;
      };
      versions: {
        api: string;
        server: string | null;
        compatible: boolean | null;
        error: "network-failure" | null;
      };
    };

function syncState(
  syncedAt: number | null,
  syncIntervalMs: number
): HealthSyncState {
  if (syncedAt == null || syncedAt <= 0) {
    return "never";
  }
  return isSyncStale(syncedAt, syncIntervalMs) ? "stale" : "ok";
}

export async function buildHealthPayload(): Promise<HealthPayload> {
  if (!isActualConfigured()) {
    return {
      status: "ok",
      actualConfigured: false,
    };
  }

  const { syncedAt, syncIntervalMs } = getSyncStatus();
  const apiVersion = getActualApiVersion();
  const { ACTUAL_SERVER_URL } = getEnv();
  const serverResult = ACTUAL_SERVER_URL
    ? await fetchActualServerVersion(ACTUAL_SERVER_URL)
    : { error: "network-failure" as const };

  const serverVersion = "version" in serverResult ? serverResult.version : null;
  const comparison =
    serverVersion != null
      ? compareActualVersions(apiVersion, serverVersion)
      : null;

  return {
    status: "ok",
    actualConfigured: true,
    sync: {
      syncedAt,
      syncIntervalMs,
      state: syncState(syncedAt, syncIntervalMs),
    },
    versions: {
      api: apiVersion,
      server: serverVersion,
      compatible: comparison?.compatible ?? null,
      error: "error" in serverResult ? serverResult.error : null,
    },
  };
}
