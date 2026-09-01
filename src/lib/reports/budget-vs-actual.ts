import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount, monthKey } from "@/lib/format";
import {
  buildCategoryGroupIndex,
  buildExcludedCategoryIdSet,
  isCategoryExcluded,
} from "@/lib/reports/category-filter";
import { filterAccounts, type ReportFilters } from "@/lib/reports/filters";
import {
  monthStartsForRange,
  type ReportRange,
} from "@/lib/reports/report-range";

export type BudgetActualRow = {
  category: string;
  budgeted: number;
  spent: number;
  balance: number;
};

export type BudgetHistoryPoint = {
  month: string;
  budgeted: number;
  spent: number;
};

export type BudgetVsActualReport = {
  categories: BudgetActualRow[];
  history: BudgetHistoryPoint[];
};

export type CategoryBudget = {
  categoryId: string;
  category: string;
  budgeted: number;
};

export type CategorySpendTx = {
  id: string;
  categoryId?: string | null;
  categoryName: string;
  amount: number;
  transferId?: string | null;
};

export type BudgetMonthInput = {
  month: string;
  categories: CategoryBudget[];
  transactions: CategorySpendTx[];
};

type CategoryRow = {
  id?: string;
  name?: string;
  budgeted?: number;
  spent?: number;
  balance?: number;
};

function spentByCategory(
  transactions: CategorySpendTx[],
  excludedCategoryIds: Set<string> = new Set()
): Map<string, { category: string; spent: number }> {
  const ids = new Set(transactions.map((tx) => tx.id));
  const totals = new Map<string, { category: string; spent: number }>();

  for (const tx of transactions) {
    if (isCategoryExcluded(tx.categoryId ?? undefined, excludedCategoryIds)) {
      continue;
    }
    if (tx.transferId && ids.has(tx.transferId)) {
      continue;
    }
    if (tx.amount >= 0) {
      continue;
    }

    const key = tx.categoryId ?? tx.categoryName;
    const current = totals.get(key) ?? {
      category: tx.categoryName,
      spent: 0,
    };
    current.spent += Math.abs(tx.amount);
    totals.set(key, current);
  }

  return totals;
}

export function buildBudgetVsActualReport(
  months: BudgetMonthInput[],
  excludedCategoryIds: Set<string> = new Set()
): BudgetVsActualReport {
  const aggregated = new Map<
    string,
    { category: string; budgeted: number; spent: number }
  >();
  const history: BudgetHistoryPoint[] = [];

  for (const month of months) {
    const spent = spentByCategory(month.transactions, excludedCategoryIds);
    let monthBudgeted = 0;
    let monthSpent = 0;

    for (const category of month.categories) {
      if (isCategoryExcluded(category.categoryId, excludedCategoryIds)) {
        continue;
      }
      const spentRow = spent.get(category.categoryId);
      const categorySpent = spentRow?.spent ?? 0;
      monthBudgeted += category.budgeted;
      monthSpent += categorySpent;

      const current = aggregated.get(category.categoryId) ?? {
        category: category.category,
        budgeted: 0,
        spent: 0,
      };
      current.budgeted += category.budgeted;
      current.spent += categorySpent;
      aggregated.set(category.categoryId, current);
    }

    const budgetedIds = new Set(
      month.categories.map((category) => category.categoryId)
    );

    // Include uncategorized / unknown spend that wasn't in the budget sheet.
    for (const [categoryId, spentRow] of spent) {
      if (budgetedIds.has(categoryId)) {
        continue;
      }
      if (isCategoryExcluded(categoryId, excludedCategoryIds)) {
        continue;
      }
      monthSpent += spentRow.spent;
      const current = aggregated.get(categoryId) ?? {
        category: spentRow.category,
        budgeted: 0,
        spent: 0,
      };
      current.spent += spentRow.spent;
      aggregated.set(categoryId, current);
    }

    history.push({
      month: month.month,
      budgeted: monthBudgeted,
      spent: monthSpent,
    });
  }

  const categories = [...aggregated.values()]
    .filter((row) => row.budgeted !== 0 || row.spent !== 0)
    .map((row) => ({
      category: row.category,
      budgeted: row.budgeted,
      spent: row.spent,
      balance: row.budgeted - row.spent,
    }))
    .sort((a, b) => b.spent - a.spent);

  return { categories, history };
}

export async function getBudgetVsActual(
  filters: ReportFilters,
  range: ReportRange = { kind: "preset", window: { count: 1, endOffset: 0 } }
): Promise<BudgetVsActualReport> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    filters.excludedAccountIds
  );
  const categories = await actual.getCategories();
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name])
  );
  const excludedCategoryIds = buildExcludedCategoryIdSet(
    filters,
    buildCategoryGroupIndex(
      categories.map((category) => ({
        id: category.id,
        groupId: category.group_id,
      }))
    )
  );
  const monthStarts = monthStartsForRange(range);
  const months: BudgetMonthInput[] = [];

  for (const monthStart of monthStarts) {
    const month = monthKey(monthStart);
    const budget = await actual.getBudgetMonth(month);
    const categories: CategoryBudget[] = [];

    for (const group of budget.categoryGroups) {
      for (const category of group.categories ?? []) {
        const row = category as CategoryRow;
        categories.push({
          categoryId: row.id ?? row.name ?? "unknown",
          category: row.name ?? "Unknown",
          budgeted: integerToAmount(row.budgeted ?? 0),
        });
      }
    }

    const start = formatLocalDate(monthStart);
    const end = formatLocalDate(
      new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    );
    const transactions: CategorySpendTx[] = [];

    for (const account of accounts) {
      const accountTxs = await actual.getTransactions(account.id, start, end);
      for (const tx of accountTxs) {
        const categoryId =
          typeof tx.category === "string" ? tx.category : undefined;
        transactions.push({
          id: tx.id,
          categoryId,
          categoryName: categoryId
            ? (categoryNames.get(categoryId) ?? "Uncategorized")
            : "Uncategorized",
          amount: integerToAmount(tx.amount),
          transferId: tx.transfer_id,
        });
      }
    }

    months.push({ month, categories, transactions });
  }

  return buildBudgetVsActualReport(months, excludedCategoryIds);
}
