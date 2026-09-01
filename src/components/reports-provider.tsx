"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AccountPreset, Settings } from "@/lib/settings/types";
import { readDashboardUrlState } from "@/lib/dashboard-url";
import { timeframeMonths, type Timeframe } from "@/lib/reports/timeframe";
import { createId } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type AccountSummary = {
  id: string;
  name: string;
  offbudget: boolean;
  closed: boolean;
};

export type ReportScope = "trend" | "spending" | "accounts";

type ReportsContextValue = {
  accounts: AccountSummary[];
  excludedAccountIds: string[];
  presets: AccountPreset[];
  selectedPresetId: string | null;
  trendTimeframe: Timeframe;
  spendingTimeframe: Timeframe;
  setTrendTimeframe: (timeframe: Timeframe) => void;
  setSpendingTimeframe: (timeframe: Timeframe) => void;
  currency: string;
  loading: boolean;
  error: string | null;
  configured: boolean;
  toggleAccount: (accountId: string) => void;
  applyPreset: (presetId: string) => void;
  savePreset: (name: string) => Promise<void>;
  renamePreset: (presetId: string, name: string) => Promise<void>;
  updatePreset: (presetId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  queryStringFor: (scope: ReportScope) => string;
  refreshCounter: number;
  lastSyncedAt: number | null;
  syncIntervalMs: number;
  syncing: boolean;
  syncError: string | null;
};

const ReportsContext = createContext<ReportsContextValue | null>(null);

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload.data as T;
}

function buildQueryString(
  excludedAccountIds: string[],
  timeframe?: Timeframe
): string {
  const params = new URLSearchParams();
  for (const id of excludedAccountIds) {
    params.append("excludedAccountIds", id);
  }
  if (timeframe) {
    params.set("months", String(timeframeMonths(timeframe)));
    params.set("timeframe", timeframe);
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function ReportsProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const initialUrl = readDashboardUrlState(searchParams);

  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [excludedAccountIds, setExcludedAccountIds] = useState<string[]>(
    () => initialUrl.excludedAccountIds ?? []
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    () => initialUrl.presetId ?? null
  );
  const [trendTimeframe, setTrendTimeframeState] = useState<Timeframe>(
    () => initialUrl.trend ?? "12m"
  );
  const [spendingTimeframe, setSpendingTimeframeState] = useState<Timeframe>(
    () => initialUrl.spending ?? "this-month"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currency, setCurrency] = useState("GBP");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncIntervalMs, setSyncIntervalMs] = useState(300_000);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const urlOverridesRef = useRef(initialUrl);

  useEffect(() => {
    urlOverridesRef.current = readDashboardUrlState(searchParams);
  }, [searchParams]);

  const fetchSyncStatus = useCallback(async () => {
    const response = await fetch("/api/sync/status");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to read sync status");
    }
    const status = payload.data as { syncedAt: number; syncIntervalMs: number };
    setLastSyncedAt(status.syncedAt);
    setSyncIntervalMs(status.syncIntervalMs);
  }, []);

  const persistSettings = useCallback(async (next: Settings) => {
    try {
      const saved = await fetchJson<Settings>("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setSettings(saved);
      return saved;
    } catch (persistError) {
      const message =
        persistError instanceof Error
          ? persistError.message
          : "Failed to save settings";
      setError(message);
      throw persistError;
    }
  }, []);

  const load = useCallback(async () => {
    try {
      // Await before any setState so the mount effect stays lint-clean
      // (react-hooks/set-state-in-effect).
      const health = await fetch("/api/health").then((r) => r.json());
      setError(null);
      setConfigured(Boolean(health.actualConfigured));

      if (!health.actualConfigured) {
        setLoading(false);
        return;
      }

      const [accountRows, savedSettings, preferenceRows] = await Promise.all([
        fetchJson<AccountSummary[]>("/api/accounts"),
        fetchJson<Settings>("/api/settings"),
        fetchJson<{ currency: string }>("/api/preferences").catch(() => ({
          currency: "GBP",
        })),
      ]);
      await fetchSyncStatus().catch(() => undefined);

      const openAccounts = accountRows.filter((account) => !account.closed);
      setAccounts(openAccounts);
      setSettings(savedSettings);
      setCurrency(preferenceRows.currency || "GBP");

      const url = urlOverridesRef.current;
      const legacy = savedSettings.timeframe;

      setTrendTimeframeState(
        url.trend ?? savedSettings.trendTimeframe ?? legacy ?? "12m"
      );
      setSpendingTimeframeState(
        url.spending ?? savedSettings.spendingTimeframe ?? "this-month"
      );

      const urlPreset =
        url.presetId &&
        savedSettings.presets.find((preset) => preset.id === url.presetId);

      if (urlPreset) {
        setSelectedPresetId(urlPreset.id);
        setExcludedAccountIds(urlPreset.excludedAccountIds);
      } else if (url.excludedAccountIds) {
        setSelectedPresetId(null);
        setExcludedAccountIds(url.excludedAccountIds);
      } else {
        const savedPresetId = savedSettings.selectedPresetId ?? null;
        const matchingPreset = savedPresetId
          ? savedSettings.presets.find((preset) => preset.id === savedPresetId)
          : undefined;

        if (matchingPreset) {
          setSelectedPresetId(matchingPreset.id);
          setExcludedAccountIds(matchingPreset.excludedAccountIds);
        } else {
          setSelectedPresetId(null);
          setExcludedAccountIds(
            savedSettings.reportSelections["dashboard"]?.excludedAccountIds ??
              []
          );
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }, [fetchSyncStatus]);

  useEffect(() => {
    // Mount fetch against Actual; setState after the network response is expected.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial load
    void load();
  }, [load]);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchSyncStatus().catch(() => undefined);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [configured, fetchSyncStatus]);

  const toggleAccount = useCallback(
    (accountId: string) => {
      if (!settings) {
        return;
      }

      setExcludedAccountIds((current) => {
        const nextExcluded = current.includes(accountId)
          ? current.filter((id) => id !== accountId)
          : [...current, accountId];

        setSelectedPresetId(null);
        void persistSettings({
          ...settings,
          selectedPresetId: null,
          reportSelections: {
            ...settings.reportSelections,
            dashboard: { excludedAccountIds: nextExcluded },
          },
        });

        return nextExcluded;
      });
    },
    [persistSettings, settings]
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      if (!settings || !presetId) {
        return;
      }

      const preset = settings.presets.find((item) => item.id === presetId);
      if (!preset) {
        return;
      }

      setSelectedPresetId(presetId);
      setExcludedAccountIds(preset.excludedAccountIds);
      void persistSettings({
        ...settings,
        selectedPresetId: presetId,
        reportSelections: {
          ...settings.reportSelections,
          dashboard: { excludedAccountIds: preset.excludedAccountIds },
        },
      });
    },
    [persistSettings, settings]
  );

  const savePreset = useCallback(
    async (name: string) => {
      if (!settings) {
        setError("Settings are still loading — try again in a moment.");
        return;
      }

      try {
        const preset: AccountPreset = {
          id: createId("preset"),
          name,
          excludedAccountIds,
        };

        const updated: Settings = {
          ...settings,
          presets: [...settings.presets, preset],
          selectedPresetId: preset.id,
          reportSelections: {
            ...settings.reportSelections,
            dashboard: { excludedAccountIds },
          },
        };

        await persistSettings(updated);
        setSelectedPresetId(preset.id);
      } catch (saveError) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : "Failed to save preset";
        setError(message);
        throw saveError;
      }
    },
    [excludedAccountIds, persistSettings, settings]
  );

  const renamePreset = useCallback(
    async (presetId: string, name: string) => {
      if (!settings || !name.trim()) {
        return;
      }

      const trimmed = name.trim();
      const presets = settings.presets.map((preset) =>
        preset.id === presetId ? { ...preset, name: trimmed } : preset
      );

      if (!presets.some((preset) => preset.id === presetId)) {
        return;
      }

      await persistSettings({ ...settings, presets });
    },
    [persistSettings, settings]
  );

  const updatePreset = useCallback(
    async (presetId: string) => {
      if (!settings) {
        return;
      }

      const presets = settings.presets.map((preset) =>
        preset.id === presetId ? { ...preset, excludedAccountIds } : preset
      );

      if (!presets.some((preset) => preset.id === presetId)) {
        return;
      }

      const updated: Settings = {
        ...settings,
        presets,
        selectedPresetId: presetId,
        reportSelections: {
          ...settings.reportSelections,
          dashboard: { excludedAccountIds },
        },
      };

      await persistSettings(updated);
      setSelectedPresetId(presetId);
    },
    [excludedAccountIds, persistSettings, settings]
  );

  const setTrendTimeframe = useCallback(
    (next: Timeframe) => {
      setTrendTimeframeState(next);
      if (settings) {
        void persistSettings({
          ...settings,
          trendTimeframe: next,
          timeframe: next,
        });
      }
    },
    [persistSettings, settings]
  );

  const setSpendingTimeframe = useCallback(
    (next: Timeframe) => {
      setSpendingTimeframeState(next);
      if (settings) {
        void persistSettings({
          ...settings,
          spendingTimeframe: next,
        });
      }
    },
    [persistSettings, settings]
  );

  const refreshData = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Sync failed");
      }

      const result = payload.data as { syncedAt: number };
      setLastSyncedAt(result.syncedAt);
      setRefreshCounter((count) => count + 1);
      await load();
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : "Sync failed";
      setSyncError(message);
      throw refreshError;
    } finally {
      setSyncing(false);
    }
  }, [load]);

  const queryStringFor = useCallback(
    (scope: ReportScope) => {
      if (scope === "trend") {
        return buildQueryString(excludedAccountIds, trendTimeframe);
      }
      if (scope === "spending") {
        return buildQueryString(excludedAccountIds, spendingTimeframe);
      }
      return buildQueryString(excludedAccountIds);
    },
    [excludedAccountIds, spendingTimeframe, trendTimeframe]
  );

  const value = useMemo<ReportsContextValue>(
    () => ({
      accounts,
      excludedAccountIds,
      presets: settings?.presets ?? [],
      selectedPresetId,
      trendTimeframe,
      spendingTimeframe,
      setTrendTimeframe,
      setSpendingTimeframe,
      currency,
      loading,
      error,
      configured,
      toggleAccount,
      applyPreset,
      savePreset,
      renamePreset,
      updatePreset,
      refreshData,
      queryStringFor,
      refreshCounter,
      lastSyncedAt,
      syncIntervalMs,
      syncing,
      syncError,
    }),
    [
      accounts,
      excludedAccountIds,
      settings?.presets,
      selectedPresetId,
      trendTimeframe,
      spendingTimeframe,
      setTrendTimeframe,
      setSpendingTimeframe,
      currency,
      loading,
      error,
      configured,
      toggleAccount,
      applyPreset,
      savePreset,
      renamePreset,
      updatePreset,
      refreshData,
      queryStringFor,
      refreshCounter,
      lastSyncedAt,
      syncIntervalMs,
      syncing,
      syncError,
    ]
  );

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  );
}

export function useReportsContext() {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReportsContext must be used within ReportsProvider");
  }
  return context;
}

export function useReportData<T>(path: string, scope: ReportScope = "trend") {
  const { queryStringFor, configured, refreshCounter } = useReportsContext();
  const queryString = queryStringFor(scope);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchJson<T>(`/api/reports/${path}${queryString}`);
        if (!cancelled) {
          setData(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [path, queryString, configured, refreshCounter]);

  return { data, loading: configured ? loading : false, error };
}
