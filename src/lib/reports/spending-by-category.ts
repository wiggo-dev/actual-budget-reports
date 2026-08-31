import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount, monthKey } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";
import {
  dateRangeForWindow,
  monthsInWindow,
  type MonthWindow,
} from "@/lib/reports/timeframe";

export type CategorySpendRow = {
  category: string;
  amount: number;
};

export type SpendingTrendPoint = {
  month: string;
  total: number;
} & Record<string, number | string>;

export type SpendingTrendSeries = {
  categories: string[];
  points: SpendingTrendPoint[];
};

async function loadCategoryNames() {
  const categories = await actual.getCategories();
  return new Map(categories.map((category) => [category.id, category.name]));
}

function resolveCategoryName(
  categoryId: string | undefined,
  categoryNames: Map<string, string>
) {
  if (!categoryId) {
    return "Uncategorized";
  }
  return categoryNames.get(categoryId) ?? "Uncategorized";
}

export async function getSpendingByCategory(
  excludedAccountIds: string[],
  window: MonthWindow = { count: 1, endOffset: 0 }
): Promise<CategorySpendRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const categoryNames = await loadCategoryNames();
  const { start, end } = dateRangeForWindow(window);
  const totals = new Map<string, number>();

  for (const account of accounts) {
    const transactions = await actual.getTransactions(account.id, start, end);

    for (const tx of transactions) {
      if (tx.amount >= 0) {
        continue;
      }

      const categoryId =
        typeof tx.category === "string" ? tx.category : undefined;
      const category = resolveCategoryName(categoryId, categoryNames);
      totals.set(
        category,
        (totals.get(category) ?? 0) + integerToAmount(tx.amount)
      );
    }
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: Math.abs(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getSpendingByCategoryTrend(
  excludedAccountIds: string[],
  window: MonthWindow = { count: 12, endOffset: 0 },
  topCategories = 7
): Promise<SpendingTrendSeries> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const categoryNames = await loadCategoryNames();
  const monthStarts = monthsInWindow(window);
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
