"use client";

import type { ReactNode } from "react";

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
import { useReportsContext } from "@/components/reports-provider";
import { formatMoney } from "@/lib/format";
import { timeframeLabel } from "@/lib/reports/timeframe";
import type { DashboardView } from "@/lib/dashboard-views";

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
  const { currency } = useReportsContext();
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

      <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-2">
        <p className="text-sm text-zinc-500">
          Savings rate · {stats.trendTimeframeLabel.toLowerCase()}
        </p>
        <p
          className="mt-2 text-3xl font-semibold text-zinc-900"
          data-privacy-value
        >
          {stats.periodSavingsRate != null
            ? formatRate(stats.periodSavingsRate)
            : "—"}
        </p>
        <p className="text-sm text-zinc-500">
          {stats.periodSavingsRate == null
            ? "Need income in this period"
            : "of income kept"}
        </p>
        <SavingsRateSpark series={stats.savingsRateSeries} />
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-2">
        <p className="text-sm text-zinc-500">{stats.spendingTimeframeLabel}</p>
        <p
          className="mt-2 text-3xl font-semibold text-zinc-900"
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

      <div className="rounded-[2rem] bg-white p-6 shadow-sm md:col-span-3">
        <p className="mb-4 text-sm text-zinc-500">
          Spending mix · {stats.spendingTimeframeLabel.toLowerCase()}
        </p>
        <SpendingDonutChart compact showLegend />
      </div>

      <div className="rounded-[2rem] bg-lime-200 p-6 md:col-span-3">
        <p className="mb-4 text-sm text-emerald-900/70">
          Cash flow · {stats.trendTimeframeLabel.toLowerCase()}
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
  exportView,
  children,
}: {
  title: string;
  description: string;
  exportView?: Exclude<DashboardView, "overview">;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
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
  const { trendTimeframe, spendingTimeframe } = useReportsContext();
  const trendRange = timeframeLabel(trendTimeframe);
  const spendingRange = timeframeLabel(spendingTimeframe);

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
