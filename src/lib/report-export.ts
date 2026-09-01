import {
  buildExportFilename,
  joinCsvSections,
  rowsToCsv,
} from "@/lib/export-csv";
import type { DashboardView } from "@/lib/dashboard-views";

type ReportScope = "trend" | "spending" | "accounts";

type SpendingRow = { category: string; amount: number };
type PayeeRow = { payeeId: string | null; payee: string; amount: number };
type BudgetReport = {
  categories: { category: string; budgeted: number; spent: number }[];
  history: { month: string; budgeted: number; spent: number }[];
};
type SpendingTrend = {
  categories: string[];
  points: Array<
    { month: string; total: number } & Record<string, number | string>
  >;
};

async function fetchReport<T>(path: string, query: string): Promise<T> {
  const response = await fetch(`/api/reports/${path}${query}`);
  const payload = await fetchReportPayload(response);
  return payload.data as T;
}

async function fetchReportPayload(
  response: Response
): Promise<{ data: unknown }> {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to load report"
    );
  }
  return payload;
}

export function netWorthToCsv(
  rows: {
    month: string;
    netWorth: number;
    onBudget?: number;
    offBudget?: number;
  }[]
): string {
  const hasComposition = rows.some(
    (row) => row.onBudget != null || row.offBudget != null
  );

  if (!hasComposition) {
    return rowsToCsv(
      ["month", "net_worth"],
      rows.map((row) => [row.month, row.netWorth])
    );
  }

  return rowsToCsv(
    ["month", "on_budget", "off_budget", "net_worth"],
    rows.map((row) => [
      row.month,
      row.onBudget ?? "",
      row.offBudget ?? "",
      row.netWorth,
    ])
  );
}

export function accountBalancesToCsv(
  rows: { name: string; balance: number; offbudget: boolean }[]
): string {
  return rowsToCsv(
    ["account", "balance", "off_budget"],
    rows.map((row) => [row.name, row.balance, row.offbudget ? "yes" : "no"])
  );
}

export function spendingMixToCsv(rows: SpendingRow[]): string {
  return rowsToCsv(
    ["category", "amount"],
    rows.map((row) => [row.category, row.amount])
  );
}

export function spendingTrendToCsv(trend: SpendingTrend): string {
  const headers = ["month", ...trend.categories, "total"];
  const rows = trend.points.map((point) => [
    point.month,
    ...trend.categories.map((category) => Number(point[category] ?? 0)),
    Number(point.total),
  ]);
  return rowsToCsv(headers, rows);
}

export function payeeSpendingToCsv(rows: PayeeRow[]): string {
  return rowsToCsv(
    ["payee", "amount"],
    rows.map((row) => [row.payee, row.amount])
  );
}

export function incomeVsExpensesToCsv(
  rows: { month: string; income: number; expenses: number }[]
): string {
  return rowsToCsv(
    ["month", "income", "expenses"],
    rows.map((row) => [row.month, row.income, row.expenses])
  );
}

export function budgetVsActualToCsv(report: BudgetReport): string {
  const sections = [
    {
      title: "Budget vs actual by category",
      csv: rowsToCsv(
        ["category", "budgeted", "spent"],
        report.categories.map((row) => [row.category, row.budgeted, row.spent])
      ),
    },
  ];

  if (report.history.length > 0) {
    sections.push({
      title: "Budget vs actual history",
      csv: rowsToCsv(
        ["month", "budgeted", "spent"],
        report.history.map((row) => [row.month, row.budgeted, row.spent])
      ),
    });
  }

  return joinCsvSections(sections);
}

export function cashFlowToCsv(
  rows: { month: string; inflow: number; outflow: number }[]
): string {
  return rowsToCsv(
    ["month", "inflow", "outflow"],
    rows.map((row) => [row.month, row.inflow, row.outflow])
  );
}

function filenameScopeForView(
  view: Exclude<DashboardView, "overview">,
  trendScopeLabel: string,
  spendingScopeLabel: string
): string {
  if (view === "account-balances") {
    return "current";
  }
  if (
    view === "spending-by-category" ||
    view === "payee-spending" ||
    view === "budget-vs-actual"
  ) {
    return `${spendingScopeLabel} + ${trendScopeLabel} trend`;
  }
  return trendScopeLabel;
}

export async function buildReportCsvExport(
  view: Exclude<DashboardView, "overview">,
  queryStringFor: (scope: ReportScope) => string,
  trendScopeLabel: string,
  spendingScopeLabel: string
): Promise<{ filename: string; content: string }> {
  switch (view) {
    case "net-worth": {
      const data = await fetchReport<{ month: string; netWorth: number }[]>(
        "net-worth",
        queryStringFor("trend")
      );
      if (!data.length) {
        throw new Error("No net worth data to export.");
      }
      return {
        filename: buildExportFilename(view, trendScopeLabel),
        content: netWorthToCsv(data),
      };
    }
    case "account-balances": {
      const data = await fetchReport<
        { name: string; balance: number; offbudget: boolean }[]
      >("account-balances", queryStringFor("accounts"));
      if (!data.length) {
        throw new Error("No account balances to export.");
      }
      return {
        filename: buildExportFilename(view),
        content: accountBalancesToCsv(data),
      };
    }
    case "spending-by-category": {
      const [mix, trend] = await Promise.all([
        fetchReport<SpendingRow[]>(
          "spending-by-category",
          queryStringFor("spending")
        ),
        fetchReport<SpendingTrend>("spending-trend", queryStringFor("trend")),
      ]);
      if (!mix.length && !trend.points.length) {
        throw new Error("No spending data to export.");
      }
      const sections = [];
      if (mix.length) {
        sections.push({
          title: `Spending mix (${spendingScopeLabel})`,
          csv: spendingMixToCsv(mix),
        });
      }
      if (trend.points.length) {
        sections.push({
          title: `Spending trend (${trendScopeLabel})`,
          csv: spendingTrendToCsv(trend),
        });
      }
      return {
        filename: buildExportFilename(
          view,
          filenameScopeForView(view, trendScopeLabel, spendingScopeLabel)
        ),
        content: joinCsvSections(sections),
      };
    }
    case "payee-spending": {
      const data = await fetchReport<PayeeRow[]>(
        "payee-spending",
        queryStringFor("spending")
      );
      if (!data.length) {
        throw new Error("No payee spending to export.");
      }
      return {
        filename: buildExportFilename(view, spendingScopeLabel),
        content: payeeSpendingToCsv(data),
      };
    }
    case "income-vs-expenses": {
      const data = await fetchReport<
        { month: string; income: number; expenses: number }[]
      >("income-vs-expenses", queryStringFor("trend"));
      if (!data.length) {
        throw new Error("No income or expense data to export.");
      }
      return {
        filename: buildExportFilename(view, trendScopeLabel),
        content: incomeVsExpensesToCsv(data),
      };
    }
    case "budget-vs-actual": {
      const data = await fetchReport<BudgetReport>(
        "budget-vs-actual",
        queryStringFor("spending")
      );
      if (!data.categories.length) {
        throw new Error("No budget data to export.");
      }
      return {
        filename: buildExportFilename(view, spendingScopeLabel),
        content: budgetVsActualToCsv(data),
      };
    }
    case "cash-flow": {
      const data = await fetchReport<
        { month: string; inflow: number; outflow: number }[]
      >("cash-flow", queryStringFor("trend"));
      if (!data.length) {
        throw new Error("No cash flow data to export.");
      }
      return {
        filename: buildExportFilename(view, trendScopeLabel),
        content: cashFlowToCsv(data),
      };
    }
  }
}
