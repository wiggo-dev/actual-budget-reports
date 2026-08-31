"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
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

const budgetConfig = {
  budgeted: { label: "Budgeted", color: "#059669" },
  spent: { label: "Spent", color: "#f59e0b" },
} satisfies ChartConfig;

const donutPalette = [
  "#0d9488",
  "#f59e0b",
  "#38bdf8",
  "#fb7185",
  "#8b5cf6",
  "#14b8a6",
  "#eab308",
  "#6366f1",
  "#f97316",
  "#84cc16",
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
  const { data, loading, error } = useReportData<
    { id: string; name: string; balance: number; offbudget: boolean }[]
  >("account-balances", "accounts");

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

type SpendingRow = { category: string; amount: number };

function buildDonutSlices(data: SpendingRow[], limit: number) {
  const top = data.slice(0, limit);
  const remainder = data
    .slice(limit)
    .reduce((sum, item) => sum + item.amount, 0);
  const slices =
    remainder > 0 ? [...top, { category: "Other", amount: remainder }] : top;

  return slices.map((item, index) => ({
    ...item,
    fill: donutPalette[index % donutPalette.length],
  }));
}

function SpendingDonutView({
  data,
  money,
  className,
  compact = false,
  limit = 8,
  showLegend = false,
}: {
  data: SpendingRow[];
  money: (amount: number, options?: { hideFraction?: boolean }) => string;
  className?: string;
  compact?: boolean;
  limit?: number;
  showLegend?: boolean;
}) {
  const chartData = buildDonutSlices(data, limit);
  const total = chartData.reduce((sum, item) => sum + item.amount, 0);
  const config = Object.fromEntries(
    chartData.map((item) => [
      item.category,
      { label: item.category, color: item.fill },
    ])
  ) satisfies ChartConfig;

  return (
    <div
      className={cn(
        showLegend
          ? "flex flex-col items-center gap-4 sm:flex-row sm:items-center"
          : undefined,
        className
      )}
    >
      <ChartContainer
        config={config}
        className={cn(
          compact
            ? "mx-auto aspect-square h-48 max-w-[220px]"
            : "mx-auto aspect-square h-[280px] max-w-[280px]",
          "w-full"
        )}
      >
        <PieChart accessibilityLayer>
          <ChartTooltip content={<MoneyTooltip money={money} />} />
          <Pie
            data={chartData}
            dataKey="amount"
            nameKey="category"
            innerRadius={compact ? 48 : 68}
            outerRadius={compact ? 76 : 110}
            stroke="#fff"
            strokeWidth={2}
            paddingAngle={2}
          >
            {chartData.map((item) => (
              <Cell key={item.category} fill={item.fill} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                  return null;
                }

                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 6}
                      className="fill-zinc-900 text-lg font-semibold"
                    >
                      {money(total, { hideFraction: true })}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 14}
                      className="fill-zinc-500 text-xs"
                    >
                      total
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      {showLegend ? (
        <ul className="grid w-full gap-2 text-sm sm:flex-1">
          {chartData.map((item) => (
            <li
              key={item.category}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: item.fill }}
                />
                <span className="truncate text-zinc-700">{item.category}</span>
              </span>
              <span className="shrink-0 font-mono tabular-nums text-zinc-900">
                {money(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SpendingDonutChart({
  className,
  compact = false,
  limit = 8,
  showLegend = false,
}: {
  className?: string;
  compact?: boolean;
  limit?: number;
  showLegend?: boolean;
}) {
  const money = useMoney();
  const { data, loading, error } = useReportData<SpendingRow[]>(
    "spending-by-category",
    "spending"
  );

  if (loading) {
    return (
      <ChartSkeleton
        className={cn(compact ? "h-48" : "h-[280px]", className)}
      />
    );
  }
  if (error) return <ChartError message={error} />;
  if (!data?.length) {
    return <ChartError message="No spending data for this timeframe." />;
  }

  return (
    <SpendingDonutView
      data={data}
      money={money}
      className={className}
      compact={compact}
      limit={limit}
      showLegend={showLegend}
    />
  );
}

export function SpendingByCategoryChart() {
  const money = useMoney();
  const donut = useReportData<SpendingRow[]>(
    "spending-by-category",
    "spending"
  );
  const trend = useReportData<{
    categories: string[];
    points: Array<
      { month: string; total: number } & Record<string, number | string>
    >;
  }>("spending-trend", "trend");

  if (donut.loading || trend.loading) {
    return <ChartSkeleton className="h-[280px]" />;
  }
  if (donut.error) return <ChartError message={donut.error} />;
  if (trend.error) return <ChartError message={trend.error} />;
  if (!donut.data?.length && !trend.data?.points.length) {
    return <ChartError message="No spending data for this timeframe." />;
  }

  const categories = trend.data?.categories ?? [];
  const points = trend.data?.points ?? [];
  const trendConfig = {
    ...Object.fromEntries(
      categories.map((category, index) => [
        category,
        {
          label: category,
          color: donutPalette[index % donutPalette.length],
        },
      ])
    ),
    total: { label: "Total", color: "#134e4a" },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-10">
      {donut.data?.length ? (
        <SpendingDonutView data={donut.data} money={money} showLegend />
      ) : (
        <ChartError message="No spending data for the spending timeframe." />
      )}

      {points.length ? (
        <ChartContainer
          config={trendConfig}
          className="aspect-auto h-[320px] w-full"
        >
          <ComposedChart
            data={points}
            accessibilityLayer
            margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(5)}
            />
            <YAxis
              width={72}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                money(Number(value), { hideFraction: true })
              }
            />
            <ChartTooltip content={<MoneyTooltip money={money} />} />
            <ChartLegend content={<ChartLegendContent />} />
            {categories.map((category, index) => (
              <Bar
                key={category}
                dataKey={category}
                name={category}
                stackId="spend"
                fill={donutPalette[index % donutPalette.length]}
                maxBarSize={48}
                radius={
                  index === categories.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]
                }
              />
            ))}
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#134e4a"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ChartContainer>
      ) : (
        <ChartError message="No spending trend data for the trends timeframe." />
      )}
    </div>
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
  const { data, loading, error } = useReportData<
    { category: string; budgeted: number; spent: number }[]
  >("budget-vs-actual", "accounts");

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
  const { trendTimeframe, spendingTimeframe } = useReportsContext();
  const netWorth = useReportData<{ month: string; netWorth: number }[]>(
    "net-worth",
    "trend"
  );
  const incomeExpenses = useReportData<
    { month: string; income: number; expenses: number }[]
  >("income-vs-expenses", "spending");

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
    trendTimeframeLabel: timeframeLabel(trendTimeframe),
    spendingTimeframeLabel: timeframeLabel(spendingTimeframe),
  };
}
