"use client";

import { RefreshCw } from "lucide-react";
import { useSyncExternalStore } from "react";

import { PrivacyModeToggle } from "@/components/privacy-mode";
import { ThemeModeToggle } from "@/components/theme-mode";
import { useReportsContext } from "@/components/reports-provider";
import { Button } from "@/components/ui/button";
import {
  formatSyncAge,
  formatSyncTimestamp,
  isSyncStale,
} from "@/lib/sync-display";
import { cn } from "@/lib/utils";

function useNow(intervalMs = 30_000): number | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      const timer = window.setInterval(onStoreChange, intervalMs);
      return () => window.clearInterval(timer);
    },
    () => Date.now(),
    () => null
  );
}

type DashboardToolbarProps = {
  compact?: boolean;
  className?: string;
};

export function DashboardToolbar({
  compact = false,
  className,
}: DashboardToolbarProps) {
  const {
    refreshData,
    loading,
    syncing,
    syncError,
    lastSyncedAt,
    syncIntervalMs,
  } = useReportsContext();
  const now = useNow();

  const syncStale =
    lastSyncedAt != null &&
    now != null &&
    isSyncStale(lastSyncedAt, syncIntervalMs, now);

  async function handleRefresh() {
    try {
      await refreshData();
    } catch {
      // syncError is surfaced in the status line
    }
  }

  const statusLine = syncError ? (
    <p
      className="truncate text-xs text-rose-600"
      role="alert"
      title={syncError}
    >
      Sync failed — {syncError}
    </p>
  ) : syncing ? (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">Syncing…</p>
  ) : lastSyncedAt != null ? (
    <p
      className={cn(
        "text-xs",
        syncStale
          ? "text-amber-700 dark:text-amber-400"
          : "text-zinc-500 dark:text-zinc-400"
      )}
      title={formatSyncTimestamp(lastSyncedAt)}
      suppressHydrationWarning
    >
      {now != null
        ? formatSyncAge(lastSyncedAt, now)
        : formatSyncTimestamp(lastSyncedAt)}
      {!compact && syncStale && now != null ? " · data may be stale" : null}
    </p>
  ) : (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">Not synced yet</p>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact ? "shrink-0" : "w-full justify-between gap-3",
        className
      )}
    >
      {!compact ? <div className="min-w-0 flex-1">{statusLine}</div> : null}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-xl"
          onClick={() => void handleRefresh()}
          disabled={loading || syncing}
          title={syncing ? "Syncing…" : "Refresh from Actual"}
        >
          <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
          {compact ? null : syncing ? "Syncing…" : "Refresh"}
        </Button>
        <PrivacyModeToggle />
        <ThemeModeToggle />
      </div>
    </div>
  );
}
