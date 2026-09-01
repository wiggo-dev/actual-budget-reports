"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { AccountPreset, Settings } from "@/lib/settings/types";
import { readDashboardUrlState } from "@/lib/dashboard-url";
import {
  defaultCustomRange,
  isValidCustomRange,
  type CustomDateRange,
} from "@/lib/reports/report-range";
import { scopeLabel } from "@/lib/reports/scope-label";
import type { SpendingAggregation } from "@/lib/reports/spending-by-category";
import { priorYearScope } from "@/lib/reports/yoy";
import type { OverviewModuleId } from "@/lib/overview-modules";
import { overviewModules } from "@/lib/overview-modules";
import type { ThemeMode } from "@/lib/theme";
import {
  applyThemeMode,
  cacheThemeMode,
  getServerThemeSnapshot,
  readCachedThemeMode,
  subscribeToCachedTheme,
} from "@/lib/theme-client";
import { timeframeMonths, type Timeframe } from "@/lib/reports/timeframe";
import { createId } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type AccountSummary = {
  id: string;
  name: string;
  offbudget: boolean;
  closed: boolean;
};

type CategoryGroupSummary = {
  id: string;
  name: string;
  isIncome: boolean;
};

type CategorySummary = {
  id: string;
  name: string;
  groupId: string;
  isIncome: boolean;
};

export type ReportScope = "trend" | "spending" | "accounts";

type ReportsContextValue = {
  accounts: AccountSummary[];
  categoryGroups: CategoryGroupSummary[];
  categories: CategorySummary[];
  excludedAccountIds: string[];
  excludedCategoryIds: string[];
  excludedCategoryGroupIds: string[];
  presets: AccountPreset[];
  selectedPresetId: string | null;
  divergedFromPresetId: string | null;
  trendTimeframe: Timeframe;
  spendingTimeframe: Timeframe;
  trendCustomRange: CustomDateRange | null;
  spendingCustomRange: CustomDateRange | null;
  spendingLevel: SpendingAggregation;
  yoyCompare: boolean;
  hiddenOverviewModules: string[];
  theme: ThemeMode;
  setTrendTimeframe: (timeframe: Timeframe) => void;
  setSpendingTimeframe: (timeframe: Timeframe) => void;
  setTrendCustomRange: (range: CustomDateRange) => void;
  setSpendingCustomRange: (range: CustomDateRange) => void;
  setSpendingLevel: (level: SpendingAggregation) => void;
  setYoYCompare: (enabled: boolean) => void;
  setOverviewModuleVisible: (
    moduleId: OverviewModuleId,
    visible: boolean
  ) => void;
  setTheme: (theme: ThemeMode) => void;
  trendScopeLabel: string;
  spendingScopeLabel: string;
  currency: string;
  loading: boolean;
  error: string | null;
  configured: boolean;
  toggleAccount: (accountId: string) => void;
  toggleCategory: (categoryId: string) => void;
  toggleCategoryGroup: (groupId: string) => void;
  applyPreset: (presetId: string) => void;
  savePreset: (name: string) => Promise<void>;
  renamePreset: (presetId: string, name: string) => Promise<void>;
  updatePreset: (presetId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  queryStringFor: (
    scope: ReportScope,
    extraParams?: Record<string, string>
  ) => string;
  priorYearQueryStringFor: (
    scope: ReportScope,
    extraParams?: Record<string, string>
  ) => string;
  refreshCounter: number;
  lastSyncedAt: number | null;
  syncIntervalMs: number;
  syncing: boolean;
  syncError: string | null;
  versionHealth: {
    api: string;
    server: string | null;
    compatible: boolean | null;
    error: string | null;
  } | null;
};

const ReportsContext = createContext<ReportsContextValue | null>(null);

function dashboardSelection(settings: Settings) {
  const selection = settings.reportSelections["dashboard"];
  return {
    excludedAccountIds: selection?.excludedAccountIds ?? [],
    excludedCategoryIds: selection?.excludedCategoryIds ?? [],
    excludedCategoryGroupIds: selection?.excludedCategoryGroupIds ?? [],
    divergedFromPresetId: selection?.divergedFromPresetId ?? null,
  };
}

function selectionFromPreset(preset: AccountPreset) {
  return {
    excludedAccountIds: preset.excludedAccountIds,
    excludedCategoryIds: preset.excludedCategoryIds,
    excludedCategoryGroupIds: preset.excludedCategoryGroupIds,
    divergedFromPresetId: null as string | null,
  };
}

function persistDivergedFilters(
  settings: Settings,
  activePresetId: string | null,
  divergedFromPresetId: string | null,
  patch: Partial<ReturnType<typeof dashboardSelection>>
): Settings {
  const current = dashboardSelection(settings);
  const sourcePresetId =
    activePresetId ?? divergedFromPresetId ?? current.divergedFromPresetId;

  return {
    ...settings,
    selectedPresetId: null,
    reportSelections: {
      ...settings.reportSelections,
      dashboard: {
        ...current,
        ...patch,
        divergedFromPresetId: sourcePresetId,
      },
    },
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload.data as T;
}

function buildQueryString(
  filters: {
    excludedAccountIds: string[];
    excludedCategoryIds: string[];
    excludedCategoryGroupIds: string[];
  },
  timeframe?: Timeframe,
  customRange?: CustomDateRange | null,
  spendingLevel?: SpendingAggregation,
  extraParams?: Record<string, string>
): string {
  const params = new URLSearchParams();
  for (const id of filters.excludedAccountIds) {
    params.append("excludedAccountIds", id);
  }
  for (const id of filters.excludedCategoryIds) {
    params.append("excludedCategoryIds", id);
  }
  for (const id of filters.excludedCategoryGroupIds) {
    params.append("excludedCategoryGroupIds", id);
  }
  if (spendingLevel === "group") {
    params.set("spendingLevel", "group");
  }
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }
  if (timeframe === "custom") {
    if (customRange && isValidCustomRange(customRange)) {
      params.set("start", customRange.start);
      params.set("end", customRange.end);
    }
  } else if (timeframe) {
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
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroupSummary[]>(
    []
  );
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [excludedAccountIds, setExcludedAccountIds] = useState<string[]>(
    () => initialUrl.excludedAccountIds ?? []
  );
  const [excludedCategoryIds, setExcludedCategoryIds] = useState<string[]>(
    () => initialUrl.excludedCategoryIds ?? []
  );
  const [excludedCategoryGroupIds, setExcludedCategoryGroupIds] = useState<
    string[]
  >(() => initialUrl.excludedCategoryGroupIds ?? []);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    () => initialUrl.presetId ?? null
  );
  const [divergedFromPresetId, setDivergedFromPresetId] = useState<
    string | null
  >(null);
  const [trendTimeframe, setTrendTimeframeState] = useState<Timeframe>(
    () => initialUrl.trend ?? "12m"
  );
  const [spendingTimeframe, setSpendingTimeframeState] = useState<Timeframe>(
    () => initialUrl.spending ?? "this-month"
  );
  const [trendCustomRange, setTrendCustomRangeState] =
    useState<CustomDateRange | null>(() => initialUrl.trendCustom ?? null);
  const [spendingCustomRange, setSpendingCustomRangeState] =
    useState<CustomDateRange | null>(() => initialUrl.spendingCustom ?? null);
  const [spendingLevel, setSpendingLevelState] = useState<SpendingAggregation>(
    () => initialUrl.spendingLevel ?? "category"
  );
  const [yoyCompare, setYoYCompareState] = useState(
    () => initialUrl.yoyCompare ?? false
  );
  const [hiddenOverviewModules, setHiddenOverviewModulesState] = useState<
    string[]
  >([]);
  const cachedTheme = useSyncExternalStore(
    subscribeToCachedTheme,
    readCachedThemeMode,
    getServerThemeSnapshot
  );
  const [theme, setThemeState] = useState<ThemeMode | null>(null);
  const resolvedTheme = theme ?? cachedTheme;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currency, setCurrency] = useState("GBP");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncIntervalMs, setSyncIntervalMs] = useState(300_000);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [versionHealth, setVersionHealth] =
    useState<ReportsContextValue["versionHealth"]>(null);

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
      setVersionHealth(health.versions ?? null);

      if (!health.actualConfigured) {
        setLoading(false);
        return;
      }

      const [accountRows, categoryRows, savedSettings, preferenceRows] =
        await Promise.all([
          fetchJson<AccountSummary[]>("/api/accounts"),
          fetchJson<{
            groups: CategoryGroupSummary[];
            categories: CategorySummary[];
          }>("/api/categories"),
          fetchJson<Settings>("/api/settings"),
          fetchJson<{ currency: string }>("/api/preferences").catch(() => ({
            currency: "GBP",
          })),
        ]);
      await fetchSyncStatus().catch(() => undefined);

      const openAccounts = accountRows.filter((account) => !account.closed);
      setAccounts(openAccounts);
      setCategoryGroups(categoryRows.groups);
      setCategories(categoryRows.categories);
      setSettings(savedSettings);
      setHiddenOverviewModulesState(savedSettings.hiddenOverviewModules ?? []);
      const savedTheme = savedSettings.theme ?? "light";
      setThemeState(savedTheme);
      cacheThemeMode(savedTheme);
      setCurrency(preferenceRows.currency || "GBP");

      const url = readDashboardUrlState(searchParams);
      const legacy = savedSettings.timeframe;

      setTrendTimeframeState(
        url.trend ?? savedSettings.trendTimeframe ?? legacy ?? "12m"
      );
      setSpendingTimeframeState(
        url.spending ?? savedSettings.spendingTimeframe ?? "this-month"
      );
      setTrendCustomRangeState(url.trendCustom ?? null);
      setSpendingCustomRangeState(url.spendingCustom ?? null);
      setSpendingLevelState(url.spendingLevel ?? "category");
      setYoYCompareState(url.yoyCompare ?? false);

      const urlPreset =
        url.presetId &&
        savedSettings.presets.find((preset) => preset.id === url.presetId);

      if (urlPreset) {
        const selection = selectionFromPreset(urlPreset);
        setSelectedPresetId(urlPreset.id);
        setDivergedFromPresetId(null);
        setExcludedAccountIds(selection.excludedAccountIds);
        setExcludedCategoryIds(selection.excludedCategoryIds);
        setExcludedCategoryGroupIds(selection.excludedCategoryGroupIds);
      } else if (
        url.excludedAccountIds ||
        url.excludedCategoryIds ||
        url.excludedCategoryGroupIds
      ) {
        const selection = dashboardSelection(savedSettings);
        setSelectedPresetId(null);
        setDivergedFromPresetId(selection.divergedFromPresetId);
        setExcludedAccountIds(url.excludedAccountIds ?? []);
        setExcludedCategoryIds(url.excludedCategoryIds ?? []);
        setExcludedCategoryGroupIds(url.excludedCategoryGroupIds ?? []);
      } else {
        const savedPresetId = savedSettings.selectedPresetId ?? null;
        const matchingPreset = savedPresetId
          ? savedSettings.presets.find((preset) => preset.id === savedPresetId)
          : undefined;

        if (matchingPreset) {
          const selection = selectionFromPreset(matchingPreset);
          setSelectedPresetId(matchingPreset.id);
          setDivergedFromPresetId(null);
          setExcludedAccountIds(selection.excludedAccountIds);
          setExcludedCategoryIds(selection.excludedCategoryIds);
          setExcludedCategoryGroupIds(selection.excludedCategoryGroupIds);
        } else {
          const selection = dashboardSelection(savedSettings);
          setSelectedPresetId(null);
          setDivergedFromPresetId(selection.divergedFromPresetId);
          setExcludedAccountIds(selection.excludedAccountIds);
          setExcludedCategoryIds(selection.excludedCategoryIds);
          setExcludedCategoryGroupIds(selection.excludedCategoryGroupIds);
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }, [fetchSyncStatus, searchParams]);

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
        setDivergedFromPresetId(
          selectedPresetId ?? divergedFromPresetId ?? null
        );
        void persistSettings(
          persistDivergedFilters(
            settings,
            selectedPresetId,
            divergedFromPresetId,
            { excludedAccountIds: nextExcluded }
          )
        );

        return nextExcluded;
      });
    },
    [divergedFromPresetId, persistSettings, selectedPresetId, settings]
  );

  const toggleCategory = useCallback(
    (categoryId: string) => {
      if (!settings) {
        return;
      }

      setExcludedCategoryIds((current) => {
        const nextExcluded = current.includes(categoryId)
          ? current.filter((id) => id !== categoryId)
          : [...current, categoryId];

        setSelectedPresetId(null);
        setDivergedFromPresetId(
          selectedPresetId ?? divergedFromPresetId ?? null
        );
        void persistSettings(
          persistDivergedFilters(
            settings,
            selectedPresetId,
            divergedFromPresetId,
            { excludedCategoryIds: nextExcluded }
          )
        );

        return nextExcluded;
      });
    },
    [divergedFromPresetId, persistSettings, selectedPresetId, settings]
  );

  const toggleCategoryGroup = useCallback(
    (groupId: string) => {
      if (!settings) {
        return;
      }

      setExcludedCategoryGroupIds((current) => {
        const excluding = !current.includes(groupId);
        const nextGroups = excluding
          ? [...current, groupId]
          : current.filter((id) => id !== groupId);
        const groupCategoryIds = new Set(
          categories
            .filter((category) => category.groupId === groupId)
            .map((category) => category.id)
        );
        const nextCategories = excluding
          ? excludedCategoryIds.filter((id) => !groupCategoryIds.has(id))
          : excludedCategoryIds;

        setExcludedCategoryIds(nextCategories);
        setSelectedPresetId(null);
        setDivergedFromPresetId(
          selectedPresetId ?? divergedFromPresetId ?? null
        );
        void persistSettings(
          persistDivergedFilters(
            settings,
            selectedPresetId,
            divergedFromPresetId,
            {
              excludedCategoryIds: nextCategories,
              excludedCategoryGroupIds: nextGroups,
            }
          )
        );

        return nextGroups;
      });
    },
    [
      categories,
      divergedFromPresetId,
      excludedCategoryIds,
      persistSettings,
      selectedPresetId,
      settings,
    ]
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
      setDivergedFromPresetId(null);
      const selection = selectionFromPreset(preset);
      setExcludedAccountIds(selection.excludedAccountIds);
      setExcludedCategoryIds(selection.excludedCategoryIds);
      setExcludedCategoryGroupIds(selection.excludedCategoryGroupIds);
      void persistSettings({
        ...settings,
        selectedPresetId: presetId,
        reportSelections: {
          ...settings.reportSelections,
          dashboard: selection,
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
          excludedCategoryIds,
          excludedCategoryGroupIds,
        };

        const updated: Settings = {
          ...settings,
          presets: [...settings.presets, preset],
          selectedPresetId: preset.id,
          reportSelections: {
            ...settings.reportSelections,
            dashboard: {
              excludedAccountIds,
              excludedCategoryIds,
              excludedCategoryGroupIds,
              divergedFromPresetId: null,
            },
          },
        };

        await persistSettings(updated);
        setSelectedPresetId(preset.id);
        setDivergedFromPresetId(null);
      } catch (saveError) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : "Failed to save preset";
        setError(message);
        throw saveError;
      }
    },
    [
      excludedAccountIds,
      excludedCategoryIds,
      excludedCategoryGroupIds,
      persistSettings,
      settings,
    ]
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
        preset.id === presetId
          ? {
              ...preset,
              excludedAccountIds,
              excludedCategoryIds,
              excludedCategoryGroupIds,
            }
          : preset
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
          dashboard: {
            excludedAccountIds,
            excludedCategoryIds,
            excludedCategoryGroupIds,
            divergedFromPresetId: null,
          },
        },
      };

      await persistSettings(updated);
      setSelectedPresetId(presetId);
      setDivergedFromPresetId(null);
    },
    [
      excludedAccountIds,
      excludedCategoryIds,
      excludedCategoryGroupIds,
      persistSettings,
      settings,
    ]
  );

  const setTrendTimeframe = useCallback(
    (next: Timeframe) => {
      setTrendTimeframeState(next);
      if (next === "custom") {
        setTrendCustomRangeState((current) => current ?? defaultCustomRange());
        return;
      }

      setTrendCustomRangeState(null);
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
      if (next === "custom") {
        setSpendingCustomRangeState(
          (current) => current ?? defaultCustomRange()
        );
        return;
      }

      setSpendingCustomRangeState(null);
      if (settings) {
        void persistSettings({
          ...settings,
          spendingTimeframe: next,
        });
      }
    },
    [persistSettings, settings]
  );

  const setTrendCustomRange = useCallback((range: CustomDateRange) => {
    setTrendCustomRangeState(range);
  }, []);

  const setSpendingCustomRange = useCallback((range: CustomDateRange) => {
    setSpendingCustomRangeState(range);
  }, []);

  const setSpendingLevel = useCallback((level: SpendingAggregation) => {
    setSpendingLevelState(level);
  }, []);

  const setYoYCompare = useCallback((enabled: boolean) => {
    setYoYCompareState(enabled);
  }, []);

  useEffect(() => {
    applyThemeMode(resolvedTheme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeMode(resolvedTheme);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [resolvedTheme]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      if (!settings) {
        setThemeState(next);
        cacheThemeMode(next);
        return;
      }

      setThemeState(next);
      cacheThemeMode(next);
      void persistSettings({
        ...settings,
        theme: next,
      });
      setSettings({ ...settings, theme: next });
    },
    [persistSettings, settings]
  );

  const setOverviewModuleVisible = useCallback(
    (moduleId: OverviewModuleId, visible: boolean) => {
      if (!settings) {
        return;
      }

      setHiddenOverviewModulesState((current) => {
        const next = visible
          ? current.filter((id) => id !== moduleId)
          : [...current, moduleId];
        const allHidden = overviewModules.every((module) =>
          next.includes(module.id)
        );

        if (allHidden) {
          return current;
        }

        const updated = {
          ...settings,
          hiddenOverviewModules: next,
        };
        setSettings(updated);
        void persistSettings(updated);
        return next;
      });
    },
    [persistSettings, settings]
  );

  const trendScopeLabel = scopeLabel(trendTimeframe, trendCustomRange);
  const spendingScopeLabel = scopeLabel(spendingTimeframe, spendingCustomRange);

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

  const reportFilters = useMemo(
    () => ({
      excludedAccountIds,
      excludedCategoryIds,
      excludedCategoryGroupIds,
    }),
    [excludedAccountIds, excludedCategoryIds, excludedCategoryGroupIds]
  );

  const queryStringFor = useCallback(
    (scope: ReportScope, extraParams?: Record<string, string>) => {
      if (scope === "trend") {
        return buildQueryString(
          reportFilters,
          trendTimeframe,
          trendCustomRange,
          spendingLevel,
          extraParams
        );
      }
      if (scope === "spending") {
        return buildQueryString(
          reportFilters,
          spendingTimeframe,
          spendingCustomRange,
          spendingLevel,
          extraParams
        );
      }
      return buildQueryString(
        reportFilters,
        undefined,
        undefined,
        undefined,
        extraParams
      );
    },
    [
      reportFilters,
      spendingCustomRange,
      spendingLevel,
      spendingTimeframe,
      trendCustomRange,
      trendTimeframe,
    ]
  );

  const priorYearQueryStringFor = useCallback(
    (scope: ReportScope, extraParams?: Record<string, string>) => {
      const timeframe =
        scope === "spending" ? spendingTimeframe : trendTimeframe;
      const customRange =
        scope === "spending" ? spendingCustomRange : trendCustomRange;
      const prior = priorYearScope(timeframe, customRange);

      return buildQueryString(
        reportFilters,
        prior.timeframe,
        prior.customRange,
        spendingLevel,
        extraParams
      );
    },
    [
      reportFilters,
      spendingCustomRange,
      spendingLevel,
      spendingTimeframe,
      trendCustomRange,
      trendTimeframe,
    ]
  );

  const value = useMemo<ReportsContextValue>(
    () => ({
      accounts,
      categoryGroups,
      categories,
      excludedAccountIds,
      excludedCategoryIds,
      excludedCategoryGroupIds,
      presets: settings?.presets ?? [],
      selectedPresetId,
      divergedFromPresetId,
      trendTimeframe,
      spendingTimeframe,
      trendCustomRange,
      spendingCustomRange,
      spendingLevel,
      yoyCompare,
      hiddenOverviewModules,
      theme: resolvedTheme,
      setTrendTimeframe,
      setSpendingTimeframe,
      setTrendCustomRange,
      setSpendingCustomRange,
      setSpendingLevel,
      setYoYCompare,
      setOverviewModuleVisible,
      setTheme,
      trendScopeLabel,
      spendingScopeLabel,
      currency,
      loading,
      error,
      configured,
      toggleAccount,
      toggleCategory,
      toggleCategoryGroup,
      applyPreset,
      savePreset,
      renamePreset,
      updatePreset,
      refreshData,
      queryStringFor,
      priorYearQueryStringFor,
      refreshCounter,
      lastSyncedAt,
      syncIntervalMs,
      syncing,
      syncError,
      versionHealth,
    }),
    [
      accounts,
      categoryGroups,
      categories,
      excludedAccountIds,
      excludedCategoryIds,
      excludedCategoryGroupIds,
      settings?.presets,
      selectedPresetId,
      divergedFromPresetId,
      trendTimeframe,
      spendingTimeframe,
      trendCustomRange,
      spendingCustomRange,
      spendingLevel,
      yoyCompare,
      hiddenOverviewModules,
      resolvedTheme,
      setTrendTimeframe,
      setSpendingTimeframe,
      setTrendCustomRange,
      setSpendingCustomRange,
      setSpendingLevel,
      setYoYCompare,
      setOverviewModuleVisible,
      setTheme,
      trendScopeLabel,
      spendingScopeLabel,
      currency,
      loading,
      error,
      configured,
      toggleAccount,
      toggleCategory,
      toggleCategoryGroup,
      applyPreset,
      savePreset,
      renamePreset,
      updatePreset,
      refreshData,
      queryStringFor,
      priorYearQueryStringFor,
      refreshCounter,
      lastSyncedAt,
      syncIntervalMs,
      syncing,
      syncError,
      versionHealth,
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

export function useReportData<T>(
  path: string,
  scope: ReportScope = "trend",
  extraParams?: Record<string, string>
) {
  const { queryStringFor, configured, refreshCounter } = useReportsContext();
  const queryString = queryStringFor(scope, extraParams);
  const extraKey = extraParams ? JSON.stringify(extraParams) : "";
  const [data, setData] = useState<T | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let cancelled = false;

    async function loadReport() {
      setPending(true);
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
          setPending(false);
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [path, queryString, configured, refreshCounter, extraKey]);

  // Keep showing the previous chart until new data arrives; only block the
  // UI with a skeleton on the very first load for this hook instance.
  const loading = configured && pending && data === null;

  return { data, loading, error };
}

export function useYoYReportData<T extends { month: string }>(
  path: string,
  scope: ReportScope = "trend",
  extraParams?: Record<string, string>
) {
  const {
    yoyCompare,
    queryStringFor,
    priorYearQueryStringFor,
    configured,
    refreshCounter,
  } = useReportsContext();
  const queryString = queryStringFor(scope, extraParams);
  const priorQueryString = priorYearQueryStringFor(scope, extraParams);
  const extraKey = extraParams ? JSON.stringify(extraParams) : "";
  const [currentData, setCurrentData] = useState<T[] | null>(null);
  const [priorData, setPriorData] = useState<T[] | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let cancelled = false;

    async function loadReport() {
      setPending(true);
      setError(null);

      try {
        const current = await fetchJson<T[]>(
          `/api/reports/${path}${queryString}`
        );
        const prior = yoyCompare
          ? await fetchJson<T[]>(`/api/reports/${path}${priorQueryString}`)
          : null;

        if (!cancelled) {
          setCurrentData(current);
          setPriorData(prior);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load"
          );
        }
      } finally {
        if (!cancelled) {
          setPending(false);
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [
    path,
    queryString,
    priorQueryString,
    configured,
    refreshCounter,
    extraKey,
    yoyCompare,
  ]);

  const loading = configured && pending && currentData === null;

  return { currentData, priorData, loading, error, yoyCompare };
}

export function usePriorYearReportData<T>(
  path: string,
  scope: ReportScope = "trend",
  extraParams?: Record<string, string>
) {
  const { yoyCompare, priorYearQueryStringFor, configured, refreshCounter } =
    useReportsContext();
  const priorQueryString = priorYearQueryStringFor(scope, extraParams);
  const extraKey = extraParams ? JSON.stringify(extraParams) : "";
  const enabled = configured && yoyCompare;
  const [data, setData] = useState<T | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadReport() {
      setPending(true);
      setError(null);

      try {
        const result = await fetchJson<T>(
          `/api/reports/${path}${priorQueryString}`
        );
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
          setPending(false);
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [path, priorQueryString, enabled, refreshCounter, extraKey]);

  const loading = enabled && pending && data === null;

  return { data: enabled ? data : null, loading, error };
}
