import { describe, expect, it } from "vitest";

import { formatSyncAge, isSyncStale } from "@/lib/sync-display";

describe("formatSyncAge", () => {
  it("describes recent syncs in plain language", () => {
    const now = Date.parse("2026-09-01T12:00:00Z");
    expect(formatSyncAge(now - 5_000, now)).toBe("Synced just now");
    expect(formatSyncAge(now - 90_000, now)).toBe("Synced 1m ago");
    expect(formatSyncAge(now - 7_200_000, now)).toBe("Synced 2h ago");
  });
});

describe("isSyncStale", () => {
  it("marks data stale after the sync interval", () => {
    const now = Date.parse("2026-09-01T12:00:00Z");
    expect(isSyncStale(now - 301_000, 300_000, now)).toBe(true);
    expect(isSyncStale(now - 120_000, 300_000, now)).toBe(false);
    expect(isSyncStale(null, 300_000, now)).toBe(true);
  });
});
