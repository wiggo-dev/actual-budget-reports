import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount, monthKey } from "@/lib/format";
import {
  buildCategoryGroupIndex,
  buildExcludedCategoryIdSet,
  isCategoryExcluded,
} from "@/lib/reports/category-filter";
import { filterAccounts, type ReportFilters } from "@/lib/reports/filters";
import {
  dateBoundsForRange,
  monthStartsForRange,
  type ReportRange,
} from "@/lib/reports/report-range";

export type CategorySpendRow = {
  category: string;
  amount: number;
};

export type SpendTransaction = {
  amount: number;
  category?: unknown;
};

export function resolveCategoryName(
  categoryId: string | undefined,
  categoryNames: Map<string, string>
): string {
  if (!categoryId) {
    return "Uncategorized";
  }
  return categoryNames.get(categoryId) ?? "Uncategorized";
}

export function aggregateCategorySpend(
  transactions: SpendTransaction[],
  categoryNames: Map<string, string>,
  excludedCategoryIds: Set<string> = new Set()
): CategorySpendRow[] {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.amount >= 0) {
      continue;
    }

    const categoryId =
      typeof tx.category === "string" ? tx.category : undefined;
    if (isCategoryExcluded(categoryId, excludedCategoryIds)) {
      continue;
    }

    const category = resolveCategoryName(categoryId, categoryNames);
    totals.set(
      category,
      (totals.get(category) ?? 0) + integerToAmount(tx.amount)
    );
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: Math.abs(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export type SpendingTrendPoint = {
  month: string;
  total: number;
} & Record<string, number | string>;

export type SpendingTrendSeries = {
  categories: string[];
  points: SpendingTrendPoint[];
};

async function loadCategoryFilterState(filters: ReportFilters) {
  const categories = await actual.getCategories();
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name])
  );
  const categoryGroupIndex = buildCategoryGroupIndex(
    categories.map((category) => ({
      id: category.id,
      groupId: category.group_id,
    }))
  );
  const excludedCategoryIds = buildExcludedCategoryIdSet(
    filters,
    categoryGroupIndex
  );

  return { categoryNames, excludedCategoryIds };
}

export async function getSpendingByCategory(
  filters: ReportFilters,
  range: ReportRange = { kind: "preset", window: { count: 1, endOffset: 0 } }
): Promise<CategorySpendRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    filters.excludedAccountIds
  );
  const { categoryNames, excludedCategoryIds } =
    await loadCategoryFilterState(filters);
  const { start, end } = dateBoundsForRange(range);
  const transactions: SpendTransaction[] = [];

  for (const account of accounts) {
    const rows = await actual.getTransactions(account.id, start, end);
    transactions.push(...rows);
  }

  return aggregateCategorySpend(
    transactions,
    categoryNames,
    excludedCategoryIds
  );
}

export async function getSpendingByCategoryTrend(
  filters: ReportFilters,
  range: ReportRange = {
    kind: "preset",
    window: { count: 12, endOffset: 0 },
  },
  topCategories = 7
): Promise<SpendingTrendSeries> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    filters.excludedAccountIds
  );
  const { categoryNames, excludedCategoryIds } =
    await loadCategoryFilterState(filters);
  const monthStarts = monthStartsForRange(range);
  const monthKeys = monthStarts.map((month) => monthKey(month));

  const perMonth = new Map<string, Map<string, number>>();
  const categoryTotals = new Map<string, number>();

  for (const key of monthKeys) {
    perMonth.set(key, new Map());
  }

  for (const account of accounts) {
    for (const monthStart of monthStarts) {
      const key = monthKey(monthStart);
      const start = formatLocalDate(monthStart);
      const end = formatLocalDate(
        new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      );
      const bucket = perMonth.get(key)!;
      const transactions = await actual.getTransactions(account.id, start, end);

      for (const tx of transactions) {
        if (tx.amount >= 0) {
          continue;
        }

        const categoryId =
          typeof tx.category === "string" ? tx.category : undefined;
        if (isCategoryExcluded(categoryId, excludedCategoryIds)) {
          continue;
        }
        const category = resolveCategoryName(categoryId, categoryNames);
        const amount = Math.abs(integerToAmount(tx.amount));
        bucket.set(category, (bucket.get(category) ?? 0) + amount);
        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + amount
        );
      }
    }
  }

  const ranked = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, topCategories).map(([category]) => category);
  const topSet = new Set(top);
  const includeOther = ranked.length > top.length;
  const categories = includeOther ? [...top, "Other"] : top;

  const points: SpendingTrendPoint[] = monthKeys.map((month) => {
    const bucket = perMonth.get(month) ?? new Map();
    const point: SpendingTrendPoint = { month, total: 0 };

    for (const category of categories) {
      point[category] = 0;
    }

    for (const [category, amount] of bucket) {
      const key = topSet.has(category) ? category : "Other";
      if (!includeOther && !topSet.has(category)) {
        continue;
      }
      point[key] = Number(point[key] ?? 0) + amount;
      point.total += amount;
    }

    return point;
  });

  return { categories, points };
}
