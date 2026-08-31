"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AccountPreset, Settings } from "@/lib/settings/types";
import { timeframeMonths, type Timeframe } from "@/lib/reports/timeframe";

type AccountSummary = {
  id: string;
  name: string;
  offbudget: boolean;
  closed: boolean;
};

type ReportsContextValue = {
  accounts: AccountSummary[];
  excludedAccountIds: string[];
  presets: AccountPreset[];
  selectedPresetId: string | null;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  currency: string;
  loading: boolean;
  error: string | null;
  configured: boolean;
  toggleAccount: (accountId: string) => void;
  applyPreset: (presetId: string) => void;
  savePreset: (name: string) => Promise<void>;
  refreshData: () => Promise<void>;
  queryString: string;
  refreshCounter: number;
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

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [excludedAccountIds, setExcludedAccountIds] = useState<string[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("12m");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currency, setCurrency] = useState("GBP");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const health = await fetch("/api/health").then((r) => r.json());
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

      setAccounts(accountRows.filter((account) => !account.closed));
      setSettings(savedSettings);
      setCurrency(preferenceRows.currency || "GBP");
      setExcludedAccountIds(
        savedSettings.reportSelections["dashboard"]?.excludedAccountIds ?? []
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistSettings = useCallback(
    async (nextExcluded: string[], nextSettings: Settings) => {
      const updated: Settings = {
        ...nextSettings,
        reportSelections: {
          ...nextSettings.reportSelections,
          dashboard: { excludedAccountIds: nextExcluded },
        },
      };

      await fetchJson<Settings>("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      setSettings(updated);
    },
    []
  );

  const toggleAccount = useCallback(
    (accountId: string) => {
      setSelectedPresetId(null);
      setExcludedAccountIds((current) => {
        const next = current.includes(accountId)
          ? current.filter((id) => id !== accountId)
          : [...current, accountId];

        if (settings) {
          void persistSettings(next, settings);
        }

        return next;
      });
    },
    [persistSettings, settings]
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = settings?.presets.find((item) => item.id === presetId);
      if (!preset) {
        return;
      }

      setSelectedPresetId(presetId);
      setExcludedAccountIds(preset.excludedAccountIds);
      if (settings) {
        void persistSettings(preset.excludedAccountIds, settings);
      }
    },
    [persistSettings, settings]
  );

  const savePreset = useCallback(
    async (name: string) => {
      if (!settings) {
        return;
      }

      const preset: AccountPreset = {
        id: crypto.randomUUID(),
        name,
        excludedAccountIds,
      };

      const updated: Settings = {
        ...settings,
        presets: [...settings.presets, preset],
      };

      await fetchJson<Settings>("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      setSettings(updated);
      setSelectedPresetId(preset.id);
    },
    [excludedAccountIds, settings]
  );

  const refreshData = useCallback(async () => {
    await fetch("/api/sync", { method: "POST" });
    setRefreshCounter((count) => count + 1);
    await load();
  }, [load]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    for (const id of excludedAccountIds) {
      params.append("excludedAccountIds", id);
    }
    params.set("months", String(timeframeMonths(timeframe)));
    params.set("timeframe", timeframe);
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [excludedAccountIds, timeframe]);

  const value = useMemo<ReportsContextValue>(
    () => ({
      accounts,
      excludedAccountIds,
      presets: settings?.presets ?? [],
      selectedPresetId,
      timeframe,
      setTimeframe,
      currency,
      loading,
      error,
      configured,
      toggleAccount,
      applyPreset,
      savePreset,
      refreshData,
      queryString,
      refreshCounter,
    }),
    [
      accounts,
      excludedAccountIds,
      settings?.presets,
      selectedPresetId,
      timeframe,
      currency,
      loading,
      error,
      configured,
      toggleAccount,
      applyPreset,
      savePreset,
      refreshData,
      queryString,
      refreshCounter,
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

export function useReportData<T>(path: string) {
  const { queryString, configured, refreshCounter } = useReportsContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
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

  return { data, loading, error };
}
