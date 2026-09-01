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

export type SpendingAggregation = "category" | "group";

export type CategorySpendRow = {
  category: string;
  amount: number;
};

export type SpendTransaction = {
  amount: number;
  category?: unknown;
};

export type SpendingQueryOptions = {
  aggregation?: SpendingAggregation;
  /** When set, only include transactions in this category group. */
  groupId?: string;
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

export function resolveGroupName(
  categoryId: string | undefined,
  categoryGroupIndex: Map<string, string>,
  groupNames: Map<string, string>
): string {
  if (!categoryId) {
    return "Uncategorized";
  }
  const groupId = categoryGroupIndex.get(categoryId);
  if (!groupId) {
    return "Uncategorized";
  }
  return groupNames.get(groupId) ?? "Uncategorized";
}

function resolveSpendBucket(
  categoryId: string | undefined,
  aggregation: SpendingAggregation,
  categoryNames: Map<string, string>,
  categoryGroupIndex: Map<string, string>,
  groupNames: Map<string, string>
): string {
  if (aggregation === "group") {
    return resolveGroupName(categoryId, categoryGroupIndex, groupNames);
  }
  return resolveCategoryName(categoryId, categoryNames);
}

function categoryBelongsToGroup(
  categoryId: string | undefined,
  groupId: string | undefined,
  categoryGroupIndex: Map<string, string>
): boolean {
  if (!groupId) {
    return true;
  }
  if (!categoryId) {
    return false;
  }
  return categoryGroupIndex.get(categoryId) === groupId;
}

export function aggregateCategorySpend(
  transactions: SpendTransaction[],
  categoryNames: Map<string, string>,
  excludedCategoryIds: Set<string> = new Set(),
  options: SpendingQueryOptions & {
    categoryGroupIndex?: Map<string, string>;
    groupNames?: Map<string, string>;
  } = {}
): CategorySpendRow[] {
  const aggregation = options.aggregation ?? "category";
  const categoryGroupIndex = options.categoryGroupIndex ?? new Map();
  const groupNames = options.groupNames ?? new Map();
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
    if (
      !categoryBelongsToGroup(categoryId, options.groupId, categoryGroupIndex)
    ) {
      continue;
    }

    const bucket = resolveSpendBucket(
      categoryId,
      aggregation,
      categoryNames,
      categoryGroupIndex,
      groupNames
    );
    totals.set(bucket, (totals.get(bucket) ?? 0) + integerToAmount(tx.amount));
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
  const [categories, groups] = await Promise.all([
    actual.getCategories(),
    actual.getCategoryGroups(),
  ]);
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name])
  );
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
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

  return { categoryNames, groupNames, categoryGroupIndex, excludedCategoryIds };
}

export async function getSpendingByCategory(
  filters: ReportFilters,
  range: ReportRange = { kind: "preset", window: { count: 1, endOffset: 0 } },
  options: SpendingQueryOptions = {}
): Promise<CategorySpendRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    filters.excludedAccountIds
  );
  const { categoryNames, groupNames, categoryGroupIndex, excludedCategoryIds } =
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
    excludedCategoryIds,
    {
      ...options,
      categoryGroupIndex,
      groupNames,
    }
  );
}

export async function getSpendingByCategoryTrend(
  filters: ReportFilters,
  range: ReportRange = {
    kind: "preset",
    window: { count: 12, endOffset: 0 },
  },
  topCategories = 7,
  options: SpendingQueryOptions = {}
): Promise<SpendingTrendSeries> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    filters.excludedAccountIds
  );
  const { categoryNames, groupNames, categoryGroupIndex, excludedCategoryIds } =
    await loadCategoryFilterState(filters);
  const aggregation = options.aggregation ?? "category";
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
        if (
          !categoryBelongsToGroup(
            categoryId,
            options.groupId,
            categoryGroupIndex
          )
        ) {
          continue;
        }

        const label = resolveSpendBucket(
          categoryId,
          aggregation,
          categoryNames,
          categoryGroupIndex,
          groupNames
        );
        const amount = Math.abs(integerToAmount(tx.amount));
        bucket.set(label, (bucket.get(label) ?? 0) + amount);
        categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + amount);
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
