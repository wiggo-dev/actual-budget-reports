"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import {
  AccountBalancesChart,
  BudgetVsActualChart,
  CashFlowChart,
  IncomeVsExpensesChart,
  NetWorthChart,
  PayeeSpendingChart,
  SpendingByCategoryChart,
  SpendingDonutChart,
  useOverviewStats,
} from "@/components/report-charts";
import { ReportExportButton } from "@/components/report-export-button";
import {
  OverviewCustomizeDialog,
  useOverviewModuleVisible,
} from "@/components/overview-customize-dialog";
import { useReportsContext } from "@/components/reports-provider";
import { UpcomingSchedulesPanel } from "@/components/upcoming-schedules-panel";
import { formatMoney } from "@/lib/format";
import type { DashboardView } from "@/lib/dashboard-views";
import { cn } from "@/lib/utils";

function pct(value: number) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${(Math.abs(value) * 100).toFixed(1)}%`;
}

function formatRate(rate: number) {
  const sign = rate < 0 ? "−" : "";
  return `${sign}${Math.abs(rate * 100).toFixed(0)}%`;
}

function SavingsRateSpark({
  series,
}: {
  series: { month: string; rate: number | null }[];
}) {
  const values = series
    .map((point) => point.rate)
    .filter((rate): rate is number => rate != null);

  if (values.length < 2) {
    return null;
  }

  const width = 240;
  const height = 56;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  const positive = values[values.length - 1]! >= 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 h-14 w-full"
      preserveAspectRatio="none"
      aria-hidden
      data-privacy-value
    >
      <polygon
        points={area}
        fill={positive ? "rgba(5,150,105,0.12)" : "rgba(225,29,72,0.12)"}
      />
      <polyline
        points={line}
        fill="none"
        stroke={positive ? "#059669" : "#e11d48"}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashboardOverview() {
  const { currency, accounts, excludedAccountIds } = useReportsContext();
  const money = (amount: number) => formatMoney(amount, currency);
  const stats = useOverviewStats();
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  const [accountsMounted, setAccountsMounted] = useState(false);
  const includedAccountCount = accounts.filter(
    (account) => !excludedAccountIds.includes(account.id)
  ).length;
  const spentRatio =
    stats.periodExpenses != null &&
    stats.periodIncome != null &&
    stats.periodIncome > 0
      ? stats.periodExpenses / stats.periodIncome
      : null;
  const showNetWorth = useOverviewModuleVisible("net-worth");
  const showSavingsRate = useOverviewModuleVisible("savings-rate");
  const showSpendingPeriod = useOverviewModuleVisible("spending-period");
  const showSpendingMix = useOverviewModuleVisible("spending-mix");
  const showCashFlow = useOverviewModuleVisible("cash-flow");
  const showUpcoming = useOverviewModuleVisible("upcoming");
  const showAccounts = useOverviewModuleVisible("accounts");

  if (stats.loading) {
    return <p className="text-sm dashboard-muted">Loading overview…</p>;
  }

  if (stats.error) {
    return (
      <div className="dashboard-card p-6" role="alert">
        <h2 className="text-lg font-semibold dashboard-text">
          Could not load report data
        </h2>
        <p className="mt-2 text-sm text-rose-600">{stats.error}</p>
        <p className="mt-3 text-sm dashboard-muted">
          For local dev, set{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5">
            ACTUAL_SERVER_URL=http://localhost:5006
          </code>{" "}
          and make sure actual-server is running.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OverviewCustomizeDialog />
      </div>
      <div className="grid gap-4 md:grid-cols-6">
        {showNetWorth ? (
          <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-emerald-700 via-teal-700 to-stone-900 p-8 text-white md:col-span-4 md:row-span-2">
            <p className="text-sm text-white/70">Net worth</p>
            <p
              className="mt-2 text-5xl font-semibold tracking-tight md:text-6xl"
              data-privacy-value
            >
              {stats.latestNetWorth != null ? money(stats.latestNetWorth) : "—"}
            </p>
            {stats.netWorthDelta != null ? (
              <p
                className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm"
                data-privacy-value
              >
                {pct(stats.netWorthDelta)} over{" "}
                {stats.trendTimeframeLabel.toLowerCase()}
              </p>
            ) : null}
            <div className="mt-8 opacity-90">
              <NetWorthChart compact />
            </div>
          </div>
        ) : null}

        {showSavingsRate ? (
          <div className="dashboard-card p-6 md:col-span-2">
            <p className="text-sm dashboard-muted">
              Savings rate · {stats.trendTimeframeLabel.toLowerCase()}
            </p>
            <p
              className="mt-2 text-3xl font-semibold dashboard-text"
              data-privacy-value
            >
              {stats.periodSavingsRate != null
                ? formatRate(stats.periodSavingsRate)
                : "—"}
            </p>
            <p className="text-sm dashboard-muted">
              {stats.periodSavingsRate == null
                ? "Need income in this period"
                : "of income kept"}
            </p>
            <SavingsRateSpark series={stats.savingsRateSeries} />
          </div>
        ) : null}

        {showSpendingPeriod ? (
          <div className="dashboard-card p-6 md:col-span-2">
            <p className="text-sm dashboard-muted">
              {stats.spendingTimeframeLabel}
            </p>
            <p
              className="mt-2 text-3xl font-semibold dashboard-text"
              data-privacy-value
            >
              {stats.periodExpenses != null ? money(stats.periodExpenses) : "—"}
            </p>
            <p className="text-sm text-zinc-500" data-privacy-value>
              spent of{" "}
              {stats.periodIncome != null ? money(stats.periodIncome) : "—"}
            </p>
            {spentRatio != null ? (
              <>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.min(spentRatio * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-400" data-privacy-value>
                  {Math.round(spentRatio * 100)}% of income used
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        {showSpendingMix || showCashFlow ? (
          <div
            className={cn(
              "grid gap-4 md:col-span-6",
              showSpendingMix && showCashFlow
                ? "md:grid-cols-4"
                : "md:grid-cols-1"
            )}
          >
            {showSpendingMix ? (
              <div className="dashboard-card p-6">
                <p className="mb-4 text-sm dashboard-muted">
                  Spending mix · {stats.spendingTimeframeLabel.toLowerCase()}
                </p>
                <SpendingDonutChart compact enableDrilldown />
              </div>
            ) : null}

            {showCashFlow ? (
              <div
                className={cn(
                  "dashboard-cashflow rounded-[2rem] p-6",
                  showSpendingMix && showCashFlow && "md:col-span-3"
                )}
              >
                <p className="mb-4 text-sm text-emerald-900/70 dark:text-emerald-100/70">
                  Cash flow · {stats.trendTimeframeLabel.toLowerCase()}
                </p>
                <CashFlowChart compact />
              </div>
            ) : null}
          </div>
        ) : null}

        {showUpcoming ? (
          <UpcomingSchedulesPanel className="md:col-span-3" />
        ) : null}

        {showAccounts ? (
          <div className="dashboard-card p-6 md:col-span-6">
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors",
                "hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:outline-none",
                accountsExpanded
                  ? "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80"
                  : "border-dashed border-zinc-300 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-800/40"
              )}
              aria-expanded={accountsExpanded}
              aria-controls="overview-accounts-panel"
              onClick={() => {
                setAccountsExpanded((open) => {
                  if (!open) {
                    setAccountsMounted(true);
                  }
                  return !open;
                });
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium dashboard-text">Accounts</p>
                <p className="mt-0.5 text-sm dashboard-muted">
                  {includedAccountCount}{" "}
                  {includedAccountCount === 1 ? "account" : "accounts"} included
                  {!accountsExpanded ? " · balances hidden" : null}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">
                {accountsExpanded ? "Hide balances" : "Show balances"}
                <ChevronDown
                  className={cn(
                    "size-4 text-zinc-500 transition-transform duration-300 motion-reduce:transition-none",
                    accountsExpanded && "rotate-180"
                  )}
                  aria-hidden
                />
              </span>
            </button>
            <div
              id="overview-accounts-panel"
              className={cn(
                "grid overflow-anchor-none transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                accountsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
              aria-hidden={!accountsExpanded}
            >
              <div className="min-h-0 overflow-hidden">
                {accountsMounted ? (
                  <div className="pt-4">
                    <AccountBalancesChart />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardReportPanel({
  title,
  description,
  exportView,
  children,
}: {
  title: string;
  description: string;
  exportView?: Exclude<DashboardView, "overview">;
  children: ReactNode;
}) {
  return (
    <div className="dashboard-card p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold dashboard-text">{title}</h2>
          <p className="mt-1 text-sm dashboard-muted">{description}</p>
        </div>
        {exportView ? <ReportExportButton view={exportView} /> : null}
      </div>
      {children}
    </div>
  );
}

export function DashboardReportView({
  view,
}: {
  view: Exclude<
    import("@/components/dashboard-sidebar").DashboardView,
    "overview"
  >;
}) {
  const { trendScopeLabel, spendingScopeLabel } = useReportsContext();
  const trendRange = trendScopeLabel;
  const spendingRange = spendingScopeLabel;

  switch (view) {
    case "net-worth":
      return (
        <DashboardReportPanel
          title="Net worth over time"
          description={trendRange}
          exportView="net-worth"
        >
          <NetWorthChart />
        </DashboardReportPanel>
      );
    case "account-balances":
      return (
        <DashboardReportPanel
          title="Account balances"
          description="Current balances for included accounts"
          exportView="account-balances"
        >
          <AccountBalancesChart />
        </DashboardReportPanel>
      );
    case "spending-by-category":
      return (
        <DashboardReportPanel
          title="Spending by category"
          description={`Mix · ${spendingRange} · Trend · ${trendRange}`}
          exportView="spending-by-category"
        >
          <SpendingByCategoryChart />
        </DashboardReportPanel>
      );
    case "payee-spending":
      return (
        <DashboardReportPanel
          title="Payee spending"
          description={spendingRange}
          exportView="payee-spending"
        >
          <PayeeSpendingChart />
        </DashboardReportPanel>
      );
    case "income-vs-expenses":
      return (
        <DashboardReportPanel
          title="Income vs expenses"
          description={trendRange}
          exportView="income-vs-expenses"
        >
          <IncomeVsExpensesChart />
        </DashboardReportPanel>
      );
    case "budget-vs-actual":
      return (
        <DashboardReportPanel
          title="Budget vs actual"
          description={spendingRange}
          exportView="budget-vs-actual"
        >
          <BudgetVsActualChart />
        </DashboardReportPanel>
      );
    case "cash-flow":
      return (
        <DashboardReportPanel
          title="Cash flow"
          description={trendRange}
          exportView="cash-flow"
        >
          <CashFlowChart />
        </DashboardReportPanel>
      );
  }
}
