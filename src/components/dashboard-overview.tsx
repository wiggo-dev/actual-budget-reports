"use client";

import type { ReactNode } from "react";

import {
  AccountBalancesChart,
  BudgetVsActualChart,
  CashFlowChart,
  IncomeVsExpensesChart,
  NetWorthChart,
  SpendingByCategoryChart,
  SpendingChips,
  useOverviewStats,
} from "@/components/report-charts";
import { useReportsContext } from "@/components/reports-provider";
import { formatMoney } from "@/lib/format";
import { timeframeLabel } from "@/lib/reports/timeframe";

function pct(value: number) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${(Math.abs(value) * 100).toFixed(1)}%`;
}

export function DashboardOverview() {
  const { currency, timeframe } = useReportsContext();
  const money = (amount: number) => formatMoney(amount, currency);
  const stats = useOverviewStats();
  const spentRatio =
    stats.periodExpenses != null &&
    stats.periodIncome != null &&
    stats.periodIncome > 0
      ? stats.periodExpenses / stats.periodIncome
      : null;

  if (stats.loading) {
    return <p className="text-sm text-zinc-500">Loading overview…</p>;
  }

  if (stats.error) {
    return (
      <div className="rounded-[2rem] bg-white p-6 shadow-sm" role="alert">
        <h2 className="text-lg font-semibold text-zinc-900">
          Could not load report data
        </h2>
        <p className="mt-2 text-sm text-rose-600">{stats.error}</p>
        <p className="mt-3 text-sm text-zinc-500">
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
    <div className="grid gap-4 md:grid-cols-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-emerald-700 via-teal-700 to-stone-900 p-8 text-white md:col-span-4 md:row-span-2">
        <p className="text-sm text-white/70">Net worth</p>
        <p className="mt-2 text-5xl font-semibold tracking-tight md:text-6xl">
          {stats.latestNetWorth != null ? money(stats.latestNetWorth) : "—"}
        </p>
        {stats.netWorthDelta != null ? (
          <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm">
            {pct(stats.netWorthDelta)} over {stats.timeframeLabel.toLowerCase()}
          </p>
        ) : null}
        <div className="mt-8 opacity-90">
          <NetWorthChart compact />
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-2">
        <p className="text-sm text-zinc-500">{stats.timeframeLabel}</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-900">
          {stats.periodExpenses != null ? money(stats.periodExpenses) : "—"}
        </p>
        <p className="text-sm text-zinc-500">
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
            <p className="mt-2 text-xs text-zinc-400">
              {Math.round(spentRatio * 100)}% of income used
            </p>
          </>
        ) : null}
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-3">
        <p className="mb-4 text-sm text-zinc-500">
          Spending mix · {stats.timeframeLabel.toLowerCase()}
        </p>
        <SpendingChips />
      </div>

      <div className="rounded-[2rem] bg-lime-200 p-6 md:col-span-3">
        <p className="mb-4 text-sm text-emerald-900/70">
          Cash flow · {stats.timeframeLabel.toLowerCase()}
        </p>
        <CashFlowChart compact />
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-6">
        <p className="mb-4 text-sm text-zinc-500">Accounts</p>
        <AccountBalancesChart />
      </div>
    </div>
  );
}

export function DashboardReportPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
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
  const { timeframe } = useReportsContext();
  const range = timeframeLabel(timeframe);

  switch (view) {
    case "net-worth":
      return (
        <DashboardReportPanel title="Net worth over time" description={range}>
          <NetWorthChart />
        </DashboardReportPanel>
      );
    case "account-balances":
      return (
        <DashboardReportPanel
          title="Account balances"
          description="Current balances for included accounts"
        >
          <AccountBalancesChart />
        </DashboardReportPanel>
      );
    case "spending-by-category":
      return (
        <DashboardReportPanel title="Spending by category" description={range}>
          <SpendingByCategoryChart />
        </DashboardReportPanel>
      );
    case "income-vs-expenses":
      return (
        <DashboardReportPanel title="Income vs expenses" description={range}>
          <IncomeVsExpensesChart />
        </DashboardReportPanel>
      );
    case "budget-vs-actual":
      return (
        <DashboardReportPanel
          title="Budget vs actual"
          description="Current month"
        >
          <BudgetVsActualChart />
        </DashboardReportPanel>
      );
    case "cash-flow":
      return (
        <DashboardReportPanel title="Cash flow" description={range}>
          <CashFlowChart />
        </DashboardReportPanel>
      );
  }
}
