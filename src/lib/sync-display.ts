export function formatSyncAge(syncedAt: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - syncedAt) / 1000));

  if (seconds < 10) {
    return "Synced just now";
  }
  if (seconds < 60) {
    return `Synced ${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Synced ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Synced ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `Synced ${days}d ago`;
}

export function formatSyncTimestamp(syncedAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(syncedAt));
}

export function isSyncStale(
  syncedAt: number | null,
  syncIntervalMs: number,
  now = Date.now()
): boolean {
  if (syncedAt == null || syncedAt <= 0) {
    return true;
  }
  return now - syncedAt > syncIntervalMs;
}
