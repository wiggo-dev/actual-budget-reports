"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DashboardMobileNav,
  DashboardSidebar,
  type DashboardView,
} from "@/components/dashboard-sidebar";
import {
  DashboardOverview,
  DashboardReportView,
} from "@/components/dashboard-overview";
import { PrivacyModeProvider } from "@/components/privacy-mode";
import { DashboardToolbar } from "@/components/dashboard-toolbar";
import {
  ReportsProvider,
  useReportsContext,
} from "@/components/reports-provider";
import { TransactionDrilldownProvider } from "@/components/transaction-drilldown";
import {
  buildDashboardSearchParams,
  parseDashboardView,
} from "@/lib/dashboard-url";

function DashboardBody() {
  const {
    configured,
    error,
    loading,
    trendTimeframe,
    spendingTimeframe,
    trendCustomRange,
    spendingCustomRange,
    spendingLevel,
    yoyCompare,
    selectedPresetId,
    excludedAccountIds,
    excludedCategoryIds,
    excludedCategoryGroupIds,
  } = useReportsContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeView, setActiveView] = useState<DashboardView>(
    () => parseDashboardView(searchParams.get("view")) ?? "overview"
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const next = buildDashboardSearchParams({
      view: activeView,
      trend: trendTimeframe,
      spending: spendingTimeframe,
      trendCustom: trendCustomRange,
      spendingCustom: spendingCustomRange,
      spendingLevel,
      yoyCompare,
      presetId: selectedPresetId,
      excludedAccountIds,
      excludedCategoryIds,
      excludedCategoryGroupIds,
    }).toString();

    if (next === searchParams.toString()) {
      return;
    }

    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [
    activeView,
    excludedAccountIds,
    excludedCategoryIds,
    excludedCategoryGroupIds,
    loading,
    pathname,
    router,
    searchParams,
    selectedPresetId,
    spendingTimeframe,
    spendingCustomRange,
    spendingLevel,
    yoyCompare,
    trendTimeframe,
    trendCustomRange,
  ]);

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center dashboard-canvas p-6 font-sans">
        <div className="max-w-lg dashboard-card border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <h2 className="text-lg font-medium dashboard-text">
            Actual Budget not configured
          </h2>
          <p className="mt-2 text-sm dashboard-muted">
            Set ACTUAL_SERVER_URL, ACTUAL_SERVER_PASSWORD, and ACTUAL_SYNC_ID in
            your{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              .env
            </code>{" "}
            file, then restart the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col dashboard-canvas p-4 font-sans md:flex-row md:items-start md:gap-6 md:p-6">
      <DashboardSidebar active={activeView} onNavigate={setActiveView} />
      <div className="min-w-0 flex-1">
        <DashboardMobileNav active={activeView} onNavigate={setActiveView} />
        <div className="sticky top-0 z-20 mb-4 hidden rounded-2xl border px-3 py-2 shadow-sm backdrop-blur-sm dashboard-toolbar md:block">
          <DashboardToolbar />
        </div>
        <main className="min-w-0 pb-4">
          {error ? (
            <div
              className="mb-4 dashboard-card p-4 text-sm text-rose-600 dark:text-rose-400"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          {loading ? (
            <p className="text-sm dashboard-muted">
              Connecting to Actual Budget…
            </p>
          ) : activeView === "overview" ? (
            <DashboardOverview />
          ) : (
            <DashboardReportView view={activeView} />
          )}
        </main>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <Suspense
      fallback={<p className="p-6 text-sm text-zinc-500">Loading dashboard…</p>}
    >
      <ReportsProvider>
        <TransactionDrilldownProvider>
          <PrivacyModeProvider>
            <DashboardBody />
          </PrivacyModeProvider>
        </TransactionDrilldownProvider>
      </ReportsProvider>
    </Suspense>
  );
}
