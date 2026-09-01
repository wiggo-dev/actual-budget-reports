"use client";

import { useState } from "react";
import {
  Area,
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
  usePriorYearReportData,
  useReportData,
  useReportsContext,
  useYoYReportData,
} from "@/components/reports-provider";
import { useOptionalTransactionDrilldown } from "@/components/transaction-drilldown";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { monthlySavingsRates, savingsRate } from "@/lib/reports/savings-rate";
import type { SpendingAggregation } from "@/lib/reports/spending-by-category";
import { mergeYoYSeries, yoyHelpText } from "@/lib/reports/yoy";
import { cn } from "@/lib/utils";

const netWorthOverviewConfig = {
  netWorth: { label: "Net worth", color: "#ecfccb" },
} satisfies ChartConfig;

const netWorthReportConfig = {
  netWorth: { label: "Net worth", color: "#0f766e" },
} satisfies ChartConfig;

const netWorthCompositionConfig = {
  onBudget: { label: "On budget", color: "#0f766e" },
  offBudget: { label: "Off budget", color: "#5eead4" },
  netWorth: { label: "Total", color: "#134e4a" },
} satisfies ChartConfig;

const netWorthYoYConfig = {
  netWorthCurrent: { label: "This year", color: "#0f766e" },
  netWorthPrior: { label: "Last year", color: "#94a3b8" },
} satisfies ChartConfig;

const incomeExpenseConfig = {
  income: { label: "Income", color: "#059669" },
  expenses: { label: "Expenses", color: "#f59e0b" },
} satisfies ChartConfig;

const cashFlowConfig = {
  inflow: { label: "Inflow", color: "#065f46" },
  outflow: { label: "Outflow", color: "rgba(6,95,70,0.35)" },
} satisfies ChartConfig;

const cashFlowYoYConfig = {
  inflowCurrent: { label: "Inflow (this year)", color: "#065f46" },
  inflowPrior: { label: "Inflow (last year)", color: "#6ee7b7" },
  outflowCurrent: { label: "Outflow (this year)", color: "#f59e0b" },
  outflowPrior: { label: "Outflow (last year)", color: "#fcd34d" },
} satisfies ChartConfig;

const spendingYoYConfig = {
  totalCurrent: { label: "Total (this year)", color: "#134e4a" },
  totalPrior: { label: "Total (last year)", color: "#94a3b8" },
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

const moneyChartMargin = { top: 8, right: 12, left: 4, bottom: 0 };

function moneyYAxisProps(
  money: (amount: number, options?: { hideFraction?: boolean }) => string
) {
  return {
    width: 84,
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    tickFormatter: (value: number) =>
      money(Number(value), { hideFraction: true }),
  } as const;
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
    <div className="chart-tooltip">
      {label != null && label !== "" ? (
        <p className="font-medium dashboard-muted">{String(label)}</p>
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
                <span className="dashboard-muted">
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

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly [T, string][];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="dashboard-segment" role="group" aria-label={label}>
      {options.map(([option, optionLabel]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          className={cn(
            "dashboard-segment-btn",
            value === option && "dashboard-segment-btn-active"
          )}
          onClick={() => onChange(option)}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  );
}

function YoYToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <ToggleGroup
      value={enabled ? "on" : "off"}
      options={
        [
          ["off", "Off"],
          ["on", "YoY"],
        ] as const
      }
      onChange={(value) => onChange(value === "on")}
      label="Year-over-year comparison"
    />
  );
}

function YoYHelpText({ scopeLabel }: { scopeLabel: string }) {
  return <p className="text-sm dashboard-muted">{yoyHelpText(scopeLabel)}</p>;
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
      <p className="text-xs tracking-wide dashboard-muted uppercase">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={
              account.balance < 0
                ? "account-tile-negative"
                : "account-tile-positive"
            }
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

type NetWorthCompositionPoint = {
  month: string;
  netWorth: number;
  onBudget: number;
  offBudget: number;
};

export function NetWorthChart({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const money = useMoney();
  const { yoyCompare, setYoYCompare, trendScopeLabel } = useReportsContext();
  const { data, loading, error } =
    useReportData<NetWorthCompositionPoint[]>("net-worth");
  const yoy = useYoYReportData<NetWorthCompositionPoint>("net-worth");
  const [viewMode, setViewMode] = useState<"total" | "composition">("total");

  if (loading || (!compact && yoyCompare && yoy.loading)) {
    return <ChartSkeleton className={className} />;
  }
  if (error) return <ChartError message={error} />;
  if (!data?.length)
    return <ChartError message="No net worth data available." />;

  const lineColor = compact ? "#ecfccb" : "#0f766e";

  if (compact) {
    return (
      <ChartContainer
        config={netWorthOverviewConfig}
        className={cn("h-36 w-full", className)}
      >
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.12)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.65)" }}
          />
          <ChartTooltip
            cursor={{ stroke: "rgba(255,255,255,0.25)" }}
            content={<MoneyTooltip money={money} />}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            name="Net worth"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </LineChart>
      </ChartContainer>
    );
  }

  const yoyData =
    yoyCompare && yoy.currentData
      ? mergeYoYSeries(yoy.currentData, yoy.priorData ?? [], ["netWorth"])
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          value={viewMode}
          options={
            [
              ["total", "Total"],
              ["composition", "Composition"],
            ] as const
          }
          onChange={setViewMode}
          label="Net worth view"
        />
        {viewMode === "total" ? (
          <YoYToggle enabled={yoyCompare} onChange={setYoYCompare} />
        ) : null}
      </div>
      {yoyCompare && viewMode === "total" ? (
        <YoYHelpText scopeLabel={trendScopeLabel} />
      ) : null}

      {viewMode === "composition" ? (
        <ChartContainer
          config={netWorthCompositionConfig}
          className={cn("h-[280px] w-full", className)}
        >
          <ComposedChart
            data={data}
            accessibilityLayer
            margin={moneyChartMargin}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis {...moneyYAxisProps(money)} />
            <ChartTooltip content={<MoneyTooltip money={money} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="onBudget"
              name="On budget"
              stackId="net-worth"
              fill="var(--color-onBudget)"
              stroke="var(--color-onBudget)"
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="offBudget"
              name="Off budget"
              stackId="net-worth"
              fill="var(--color-offBudget)"
              stroke="var(--color-offBudget)"
              fillOpacity={0.55}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Total"
              stroke="var(--color-netWorth)"
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      ) : yoyData ? (
        <ChartContainer
          config={netWorthYoYConfig}
          className={cn("h-[280px] w-full", className)}
        >
          <LineChart
            data={yoyData}
            accessibilityLayer
            margin={moneyChartMargin}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis {...moneyYAxisProps(money)} />
            <ChartTooltip content={<MoneyTooltip money={money} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="netWorthCurrent"
              name="This year"
              stroke="var(--color-netWorthCurrent)"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="netWorthPrior"
              name="Last year"
              stroke="var(--color-netWorthPrior)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <ChartContainer
          config={netWorthReportConfig}
          className={cn("h-[280px] w-full", className)}
        >
          <LineChart data={data} accessibilityLayer margin={moneyChartMargin}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis {...moneyYAxisProps(money)} />
            <ChartTooltip content={<MoneyTooltip money={money} />} />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Net worth"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: lineColor }}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
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

function SpendingLevelToggle({
  value,
  onChange,
}: {
  value: SpendingAggregation;
  onChange: (value: SpendingAggregation) => void;
}) {
  return (
    <div
      className="dashboard-segment"
      role="group"
      aria-label="Spending aggregation"
    >
      {(
        [
          ["group", "Groups"],
          ["category", "Categories"],
        ] as const
      ).map(([level, label]) => (
        <button
          key={level}
          type="button"
          aria-pressed={value === level}
          className={cn(
            "dashboard-segment-btn",
            value === level && "dashboard-segment-btn-active"
          )}
          onClick={() => onChange(level)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

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
  onCategoryClick,
}: {
  data: SpendingRow[];
  money: (amount: number, options?: { hideFraction?: boolean }) => string;
  className?: string;
  compact?: boolean;
  limit?: number;
  showLegend?: boolean;
  onCategoryClick?: (category: string) => void;
}) {
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    () => new Set()
  );
  const allSlices = buildDonutSlices(data, limit);
  const chartData = allSlices.filter(
    (item) => !hiddenCategories.has(item.category)
  );
  const total = chartData.reduce((sum, item) => sum + item.amount, 0);
  const config = Object.fromEntries(
    allSlices.map((item) => [
      item.category,
      { label: item.category, color: item.fill },
    ])
  ) satisfies ChartConfig;

  function toggleCategory(category: string) {
    setHiddenCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
        return next;
      }

      const visibleCount = allSlices.filter(
        (item) => !next.has(item.category)
      ).length;
      if (visibleCount <= 1) {
        return current;
      }

      next.add(category);
      return next;
    });
  }

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
            animationBegin={0}
            animationDuration={280}
            animationEasing="ease-out"
            cursor={onCategoryClick ? "pointer" : undefined}
            onClick={(_, index) => {
              const slice = chartData[index];
              if (slice && onCategoryClick && slice.category !== "Other") {
                onCategoryClick(slice.category);
              }
            }}
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
          {allSlices.map((item) => {
            const hidden = hiddenCategories.has(item.category);
            return (
              <li
                key={item.category}
                className={cn(
                  "flex min-w-0 items-center gap-2",
                  hidden && "opacity-45"
                )}
              >
                <button
                  type="button"
                  aria-pressed={!hidden}
                  aria-label={
                    hidden
                      ? `Show ${item.category} on chart`
                      : `Hide ${item.category} from chart`
                  }
                  title={
                    hidden ? `Show ${item.category}` : `Hide ${item.category}`
                  }
                  className={cn(
                    "size-2.5 shrink-0 rounded-full transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
                    hidden && "ring-1 ring-zinc-300 ring-offset-1"
                  )}
                  style={{ background: item.fill }}
                  onClick={() => toggleCategory(item.category)}
                />
                <button
                  type="button"
                  className={cn(
                    "truncate text-left dashboard-text",
                    hidden && "line-through",
                    onCategoryClick &&
                      item.category !== "Other" &&
                      "hover:underline"
                  )}
                  disabled={!onCategoryClick || item.category === "Other"}
                  onClick={() => {
                    if (onCategoryClick && item.category !== "Other") {
                      onCategoryClick(item.category);
                    }
                  }}
                >
                  {item.category}
                </button>
                <span className="shrink-0 font-mono tabular-nums dashboard-text">
                  {money(item.amount)}
                </span>
              </li>
            );
          })}
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
  const drilldown = useOptionalTransactionDrilldown();
  const {
    spendingLevel,
    setSpendingLevel,
    categoryGroups,
    yoyCompare,
    setYoYCompare,
    trendScopeLabel,
  } = useReportsContext();
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const expandedGroup = categoryGroups.find(
    (group) => group.id === expandedGroupId
  );
  const donutExtraParams =
    expandedGroupId != null
      ? { spendingLevel: "category", groupId: expandedGroupId }
      : undefined;

  const donut = useReportData<SpendingRow[]>(
    "spending-by-category",
    "spending",
    donutExtraParams
  );
  const trend = useReportData<{
    categories: string[];
    points: Array<
      { month: string; total: number } & Record<string, number | string>
    >;
  }>("spending-trend", "trend");
  const yoyTrend = usePriorYearReportData<{
    categories: string[];
    points: Array<{ month: string; total: number }>;
  }>("spending-trend", "trend");

  function handleSpendingLevelChange(level: SpendingAggregation) {
    setExpandedGroupId(null);
    setSpendingLevel(level);
  }

  function handleSliceClick(label: string) {
    if (label === "Other") {
      return;
    }

    if (spendingLevel === "group" && expandedGroupId == null) {
      const group = categoryGroups.find((item) => item.name === label);
      if (group) {
        setExpandedGroupId(group.id);
      }
      return;
    }

    drilldown?.openDrilldown({
      title: `Spending · ${label}`,
      category: label,
      scope: "spending",
    });
  }

  if (donut.loading || trend.loading || (yoyCompare && yoyTrend.loading)) {
    return <ChartSkeleton className="h-[280px]" />;
  }
  if (donut.error) return <ChartError message={donut.error} />;
  if (trend.error) return <ChartError message={trend.error} />;
  if (!donut.data?.length && !trend.data?.points.length) {
    return <ChartError message="No spending data for this timeframe." />;
  }

  const categories = trend.data?.categories ?? [];
  const points = trend.data?.points ?? [];
  const yoyTrendData =
    yoyCompare && trend.data?.points
      ? mergeYoYSeries(
          trend.data.points.map((point) => ({
            month: point.month,
            total: point.total,
          })),
          yoyTrend.data?.points.map((point) => ({
            month: point.month,
            total: point.total,
          })) ?? [],
          ["total"]
        )
      : null;
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

  const aggregationLabel =
    expandedGroup != null
      ? expandedGroup.name
      : spendingLevel === "group"
        ? "category groups"
        : "categories";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SpendingLevelToggle
          value={spendingLevel}
          onChange={handleSpendingLevelChange}
        />
        <YoYToggle enabled={yoyCompare} onChange={setYoYCompare} />
        {expandedGroup ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setExpandedGroupId(null)}
          >
            ← Back to groups
          </Button>
        ) : null}
      </div>

      {donut.data?.length ? (
        <div className="space-y-2">
          <p className="text-sm dashboard-muted">
            {expandedGroup
              ? `Categories in ${expandedGroup.name}`
              : `Spending by ${aggregationLabel}`}
          </p>
          <SpendingDonutView
            data={donut.data}
            money={money}
            showLegend
            onCategoryClick={
              drilldown || spendingLevel === "group"
                ? handleSliceClick
                : undefined
            }
          />
        </div>
      ) : (
        <ChartError message="No spending data for the spending timeframe." />
      )}

      {points.length ? (
        <div className="space-y-2">
          <p className="text-sm dashboard-muted">
            {yoyCompare
              ? "Monthly spending total vs last year"
              : `Monthly trend by ${spendingLevel === "group" ? "category group" : "category"}`}
          </p>
          {yoyCompare ? <YoYHelpText scopeLabel={trendScopeLabel} /> : null}
          {yoyTrendData ? (
            <ChartContainer
              config={spendingYoYConfig}
              className="aspect-auto h-[320px] w-full"
            >
              <LineChart data={yoyTrendData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
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
                <Line
                  type="monotone"
                  dataKey="totalCurrent"
                  name="Total (this year)"
                  stroke="var(--color-totalCurrent)"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="totalPrior"
                  name="Total (last year)"
                  stroke="var(--color-totalPrior)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <ChartContainer
              config={trendConfig}
              className="aspect-auto h-[320px] w-full"
            >
              <ComposedChart
                data={points}
                accessibilityLayer
                margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
                onClick={(state) => {
                  const month = state?.activeLabel;
                  if (typeof month === "string" && drilldown) {
                    drilldown.openDrilldown({
                      title: `Spending · ${month}`,
                      month,
                      scope: "trend",
                    });
                  }
                }}
                style={{ cursor: drilldown ? "pointer" : undefined }}
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
                      index === categories.length - 1
                        ? [6, 6, 0, 0]
                        : [0, 0, 0, 0]
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
          )}
        </div>
      ) : (
        <ChartError message="No spending trend data for the trends timeframe." />
      )}
    </div>
  );
}

export function PayeeSpendingChart() {
  const money = useMoney();
  const drilldown = useOptionalTransactionDrilldown();
  const { data, loading, error } = useReportData<
    { payeeId: string | null; payee: string; amount: number }[]
  >("payee-spending", "spending");

  if (loading) return <ChartSkeleton />;
  if (error) return <ChartError message={error} />;
  if (!data?.length) {
    return <ChartError message="No payee spending for this timeframe." />;
  }

  const chartData = data.slice(0, 12);
  const config = {
    amount: { label: "Spent", color: "#0d9488" },
  } satisfies ChartConfig;

  function openPayee(row: { payeeId: string | null; payee: string }) {
    drilldown?.openDrilldown({
      title: `Payee · ${row.payee}`,
      payeeId: row.payeeId ?? undefined,
      payee: row.payeeId ? undefined : row.payee,
      scope: "spending",
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <ChartContainer config={config} className="h-[320px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          accessibilityLayer
          margin={{ left: 8, right: 8 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => money(Number(value))}
          />
          <YAxis
            type="category"
            dataKey="payee"
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<MoneyTooltip money={money} />} />
          <Bar
            dataKey="amount"
            name="Spent"
            fill="var(--color-amount)"
            radius={8}
            cursor={drilldown ? "pointer" : undefined}
            onClick={(item) => {
              const payload = item?.payload as
                { payeeId: string | null; payee: string } | undefined;
              if (payload) {
                openPayee(payload);
              }
            }}
          />
        </BarChart>
      </ChartContainer>

      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs tracking-wide dashboard-muted uppercase">
            <tr>
              <th className="py-2 pr-3 font-medium">Payee</th>
              <th className="py-2 text-right font-medium">Spent</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={`${row.payeeId ?? row.payee}`}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-2 pr-3">
                  <button
                    type="button"
                    className="text-left dashboard-text hover:underline"
                    onClick={() => openPayee(row)}
                  >
                    {row.payee}
                  </button>
                </td>
                <td className="py-2 text-right font-mono tabular-nums dashboard-text">
                  {money(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const { data, loading, error } = useReportData<{
    categories: { category: string; budgeted: number; spent: number }[];
    history: { month: string; budgeted: number; spent: number }[];
  }>("budget-vs-actual", "spending");

  if (loading) return <ChartSkeleton />;
  if (error) return <ChartError message={error} />;
  if (!data?.categories.length)
    return <ChartError message="No budget data for this timeframe." />;

  const showHistory = data.history.length > 1;

  return (
    <div className={cn("grid gap-6", showHistory && "lg:grid-cols-2")}>
      <ChartContainer config={budgetConfig} className="h-[280px] w-full">
        <BarChart data={data.categories.slice(0, 10)} accessibilityLayer>
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
      {showHistory ? (
        <ChartContainer config={budgetConfig} className="h-[280px] w-full">
          <BarChart data={data.history} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(5)}
            />
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
      ) : null}
    </div>
  );
}

export function CashFlowChart({ compact = false }: { compact?: boolean }) {
  const money = useMoney();
  const { yoyCompare, setYoYCompare, trendScopeLabel } = useReportsContext();
  const { data, loading, error } =
    useReportData<{ month: string; inflow: number; outflow: number }[]>(
      "cash-flow"
    );
  const yoy = useYoYReportData<{
    month: string;
    inflow: number;
    outflow: number;
  }>("cash-flow");

  if (loading || (!compact && yoyCompare && yoy.loading)) {
    return <ChartSkeleton className={compact ? "h-36" : undefined} />;
  }
  if (error) return <ChartError message={error} />;
  if (!data?.length) return <ChartError message="No cash flow data." />;

  const chartData = compact ? data.slice(-6) : data;
  const yoyData =
    !compact && yoyCompare && yoy.currentData
      ? mergeYoYSeries(yoy.currentData, yoy.priorData ?? [], [
          "inflow",
          "outflow",
        ])
      : null;

  if (compact) {
    return (
      <ChartContainer config={cashFlowConfig} className="h-36 w-full">
        <BarChart data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="transparent" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => String(value).slice(5)}
          />
          <ChartTooltip content={<MoneyTooltip money={money} />} />
          <Bar dataKey="inflow" name="Inflow" fill="#065f46" radius={8} />
          <Bar
            dataKey="outflow"
            name="Outflow"
            fill="rgba(6,95,70,0.35)"
            radius={8}
          />
        </BarChart>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <YoYToggle enabled={yoyCompare} onChange={setYoYCompare} />
      </div>
      {yoyCompare ? <YoYHelpText scopeLabel={trendScopeLabel} /> : null}

      {yoyData ? (
        <ChartContainer config={cashFlowYoYConfig} className="h-[280px] w-full">
          <ComposedChart data={yoyData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => money(Number(value))}
            />
            <ChartTooltip content={<MoneyTooltip money={money} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="inflowCurrent"
              name="Inflow (this year)"
              fill="var(--color-inflowCurrent)"
              radius={8}
            />
            <Bar
              dataKey="outflowCurrent"
              name="Outflow (this year)"
              fill="var(--color-outflowCurrent)"
              radius={8}
            />
            <Line
              type="monotone"
              dataKey="inflowPrior"
              name="Inflow (last year)"
              stroke="var(--color-inflowPrior)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="outflowPrior"
              name="Outflow (last year)"
              stroke="var(--color-outflowPrior)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ChartContainer>
      ) : (
        <ChartContainer config={cashFlowConfig} className="h-[280px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => money(Number(value))}
            />
            <ChartTooltip content={<MoneyTooltip money={money} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="inflow"
              name="Inflow"
              fill="var(--color-inflow)"
              radius={8}
            />
            <Bar
              dataKey="outflow"
              name="Outflow"
              fill="var(--color-outflow)"
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

export function useOverviewStats() {
  const { trendScopeLabel, spendingScopeLabel } = useReportsContext();
  const netWorth = useReportData<{ month: string; netWorth: number }[]>(
    "net-worth",
    "trend"
  );
  const spendingIncomeExpenses = useReportData<
    { month: string; income: number; expenses: number }[]
  >("income-vs-expenses", "spending");
  const trendIncomeExpenses = useReportData<
    { month: string; income: number; expenses: number }[]
  >("income-vs-expenses", "trend");

  const latestNetWorth =
    netWorth.data?.[netWorth.data.length - 1]?.netWorth ?? null;
  const firstNetWorth = netWorth.data?.[0]?.netWorth ?? null;
  const netWorthDelta =
    latestNetWorth != null && firstNetWorth != null && firstNetWorth !== 0
      ? (latestNetWorth - firstNetWorth) / Math.abs(firstNetWorth)
      : null;

  const latestMonth =
    spendingIncomeExpenses.data?.[spendingIncomeExpenses.data.length - 1];
  const periodIncome =
    spendingIncomeExpenses.data?.reduce((sum, row) => sum + row.income, 0) ??
    null;
  const periodExpenses =
    spendingIncomeExpenses.data?.reduce((sum, row) => sum + row.expenses, 0) ??
    null;

  const trendIncome =
    trendIncomeExpenses.data?.reduce((sum, row) => sum + row.income, 0) ?? null;
  const trendExpenses =
    trendIncomeExpenses.data?.reduce((sum, row) => sum + row.expenses, 0) ??
    null;
  const periodSavingsRate =
    trendIncome != null && trendExpenses != null
      ? savingsRate(trendIncome, trendExpenses)
      : null;
  const savingsRateSeries = trendIncomeExpenses.data
    ? monthlySavingsRates(trendIncomeExpenses.data)
    : [];

  return {
    loading:
      netWorth.loading ||
      spendingIncomeExpenses.loading ||
      trendIncomeExpenses.loading,
    error:
      netWorth.error ??
      spendingIncomeExpenses.error ??
      trendIncomeExpenses.error,
    latestNetWorth,
    netWorthDelta,
    spentThisMonth: latestMonth?.expenses ?? null,
    incomeThisMonth: latestMonth?.income ?? null,
    periodIncome,
    periodExpenses,
    periodSavingsRate,
    savingsRateSeries,
    trendTimeframeLabel: trendScopeLabel,
    spendingTimeframeLabel: spendingScopeLabel,
  };
}
