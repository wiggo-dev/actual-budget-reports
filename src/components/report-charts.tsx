"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  useReportData,
  useReportsContext,
} from "@/components/reports-provider";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { timeframeLabel } from "@/lib/reports/timeframe";
import { cn } from "@/lib/utils";

const netWorthConfig = {
  netWorth: { label: "Net worth", color: "#ecfccb" },
} satisfies ChartConfig;

const incomeExpenseConfig = {
  income: { label: "Income", color: "#059669" },
  expenses: { label: "Expenses", color: "#f59e0b" },
} satisfies ChartConfig;

const cashFlowConfig = {
  inflow: { label: "Inflow", color: "#065f46" },
  outflow: { label: "Outflow", color: "rgba(6,95,70,0.35)" },
} satisfies ChartConfig;

const spendingConfig = {
  amount: { label: "Spent", color: "#0d9488" },
} satisfies ChartConfig;

const budgetConfig = {
  budgeted: { label: "Budgeted", color: "#059669" },
  spent: { label: "Spent", color: "#f59e0b" },
} satisfies ChartConfig;

const chipPalette = [
  "bg-emerald-200",
  "bg-amber-200",
  "bg-sky-200",
  "bg-rose-200",
  "bg-violet-200",
];

function useMoney() {
  const { currency } = useReportsContext();
  return (amount: number, options?: { hideFraction?: boolean }) =>
    formatMoney(amount, currency, options);
}

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

function MoneyTooltip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  money: (amount: number) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="grid min-w-40 gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-lg">
      {label != null && label !== "" ? (
        <p className="font-medium text-zinc-500">{String(label)}</p>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const value = Number(item.value);
          if (!Number.isFinite(value)) {
            return null;
          }

          return (
            <div
              key={`${item.dataKey ?? item.name}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: item.color ?? "#71717a" }}
                />
                <span className="text-zinc-600">
                  {item.name ?? String(item.dataKey ?? "Value")}
                </span>
              </div>
              <span className="font-mono font-medium tabular-nums">
                {money(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-[280px] w-full rounded-2xl", className)} />;
}

function ChartError({ message }: { message: string }) {
  return (
    <p className="text-sm text-rose-600" role="alert">
      {message}
    </p>
  );
}

function AccountGroup({
  title,
  accounts,
  money,
}: {
  title: string;
  accounts: { id: string; name: string; balance: number }[];
  money: (amount: number) => string;
}) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs tracking-wide text-zinc-500 uppercase">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={cn(
              "rounded-2xl px-4 py-4",
              account.balance < 0
                ? "bg-rose-100 text-rose-800"
                : "bg-zinc-50 text-zinc-900"
            )}
          >
            <p className="text-sm opacity-80">{account.name}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {money(account.balance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NetWorthChart({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const money = useMoney();
  const { data, loading, error } =
    useReportData<{ month: string; netWorth: number }[]>("net-worth");

  if (loading) return <ChartSkeleton className={className} />;
  if (error) return <ChartError message={error} />;
  if (!data?.length)
    return <ChartError message="No net worth data available." />;

  return (
    <ChartContainer
      config={netWorthConfig}
      className={cn(compact ? "h-36 w-full" : "h-[280px] w-full", className)}
    >
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.12)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: compact ? "rgba(255,255,255,0.65)" : undefined }}
        />
        {!compact ? (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => money(Number(value))}
          />
        ) : null}
        <ChartTooltip
          cursor={{ stroke: "rgba(255,255,255,0.25)" }}
          content={<MoneyTooltip money={money} />}
        />
        <Line
          type="monotone"
          dataKey="netWorth"
          name="Net worth"
          stroke="#ecfccb"
          strokeWidth={compact ? 2.5 : 2}
          dot={false}
          activeDot={{ r: 4, fill: "#ecfccb" }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function AccountBalancesChart() {
  const money = useMoney();
  const { data, loading, error } =
    useReportData<
      { id: string; name: string; balance: number; offbudget: boolean }[]
    >("account-balances");

  if (loading) return <ChartSkeleton />;
  if (error) return <ChartError message={error} />;
  if (!data?.length) return <ChartError message="No account balances found." />;

  const onBudget = data.filter((account) => !account.offbudget);
  const offBudget = data.filter((account) => account.offbudget);

  return (
    <div className="space-y-6">
      <AccountGroup title="On budget" accounts={onBudget} money={money} />
      <AccountGroup title="Off budget" accounts={offBudget} money={money} />
    </div>
  );
}

export function SpendingChips() {
  const money = useMoney();
  const { data, loading, error } = useReportData<
    { category: string; amount: number }[]
  >("spending-by-category");

  if (loading) return <ChartSkeleton className="h-24" />;
  if (error) return <ChartError message={error} />;
  if (!data?.length) {
    return <ChartError message="No spending data for this timeframe." />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {data.slice(0, 8).map((item, index) => (
        <span
          key={item.category}
          title={money(item.amount)}
          className={cn(
            "rounded-full px-4 py-2 text-sm text-zinc-900",
            chipPalette[index % chipPalette.length]
          )}
        >
          {item.category} · {money(item.amount)}
        </span>
      ))}
    </div>
  );
}

export function SpendingByCategoryChart() {
  const money = useMoney();
  const { data, loading, error } = useReportData<
    { category: string; amount: number }[]
  >("spending-by-category");

  if (loading) return <ChartSkeleton />;
  if (error) return <ChartError message={error} />;
  if (!data?.length) {
    return <ChartError message="No spending data for this timeframe." />;
  }

  return (
    <ChartContainer config={spendingConfig} className="h-[280px] w-full">
      <BarChart data={data.slice(0, 10)} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="category" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => money(Number(value))}
        />
        <ChartTooltip content={<MoneyTooltip money={money} />} />
        <Bar
          dataKey="amount"
          name="Spent"
          fill="var(--color-amount)"
          radius={8}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function IncomeVsExpensesChart() {
  const money = useMoney();
  const { data, loading, error } =
    useReportData<{ month: string; income: number; expenses: number }[]>(
      "income-vs-expenses"
    );

  if (loading) return <ChartSkeleton />;
  if (error) return <ChartError message={error} />;
  if (!data?.length) return <ChartError message="No income or expense data." />;

  return (
    <ChartContainer config={incomeExpenseConfig} className="h-[280px] w-full">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => money(Number(value))}
        />
        <ChartTooltip content={<MoneyTooltip money={money} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="var(--color-income)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function BudgetVsActualChart() {
  const money = useMoney();
  const { data, loading, error } =
    useReportData<{ category: string; budgeted: number; spent: number }[]>(
      "budget-vs-actual"
    );

  if (loading) return <ChartSkeleton />;
  if (error) return <ChartError message={error} />;
  if (!data?.length) return <ChartError message="No budget data this month." />;

  return (
    <ChartContainer config={budgetConfig} className="h-[280px] w-full">
      <BarChart data={data.slice(0, 10)} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="category" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => money(Number(value))}
        />
        <ChartTooltip content={<MoneyTooltip money={money} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="budgeted"
          name="Budgeted"
          fill="var(--color-budgeted)"
          radius={8}
        />
        <Bar
          dataKey="spent"
          name="Spent"
          fill="var(--color-spent)"
          radius={8}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function CashFlowChart({ compact = false }: { compact?: boolean }) {
  const money = useMoney();
  const { data, loading, error } =
    useReportData<{ month: string; inflow: number; outflow: number }[]>(
      "cash-flow"
    );

  if (loading)
    return <ChartSkeleton className={compact ? "h-36" : undefined} />;
  if (error) return <ChartError message={error} />;
  if (!data?.length) return <ChartError message="No cash flow data." />;

  const chartData = compact ? data.slice(-6) : data;

  return (
    <ChartContainer
      config={cashFlowConfig}
      className={cn(compact ? "h-36 w-full" : "h-[280px] w-full")}
    >
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid
          vertical={false}
          stroke={compact ? "transparent" : undefined}
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            compact ? String(value).slice(5) : String(value)
          }
        />
        {!compact ? (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => money(Number(value))}
          />
        ) : null}
        <ChartTooltip content={<MoneyTooltip money={money} />} />
        {!compact ? <ChartLegend content={<ChartLegendContent />} /> : null}
        <Bar
          dataKey="inflow"
          name="Inflow"
          fill={compact ? "#065f46" : "var(--color-inflow)"}
          radius={8}
        />
        <Bar
          dataKey="outflow"
          name="Outflow"
          fill={compact ? "rgba(6,95,70,0.35)" : "var(--color-outflow)"}
          radius={8}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function useOverviewStats() {
  const { timeframe } = useReportsContext();
  const netWorth =
    useReportData<{ month: string; netWorth: number }[]>("net-worth");
  const incomeExpenses =
    useReportData<{ month: string; income: number; expenses: number }[]>(
      "income-vs-expenses"
    );

  const latestNetWorth =
    netWorth.data?.[netWorth.data.length - 1]?.netWorth ?? null;
  const firstNetWorth = netWorth.data?.[0]?.netWorth ?? null;
  const netWorthDelta =
    latestNetWorth != null && firstNetWorth != null && firstNetWorth !== 0
      ? (latestNetWorth - firstNetWorth) / Math.abs(firstNetWorth)
      : null;

  const latestMonth = incomeExpenses.data?.[incomeExpenses.data.length - 1];
  const periodIncome =
    incomeExpenses.data?.reduce((sum, row) => sum + row.income, 0) ?? null;
  const periodExpenses =
    incomeExpenses.data?.reduce((sum, row) => sum + row.expenses, 0) ?? null;

  return {
    loading: netWorth.loading || incomeExpenses.loading,
    error: netWorth.error ?? incomeExpenses.error,
    latestNetWorth,
    netWorthDelta,
    spentThisMonth: latestMonth?.expenses ?? null,
    incomeThisMonth: latestMonth?.income ?? null,
    periodIncome,
    periodExpenses,
    timeframeLabel: timeframeLabel(timeframe),
  };
}
