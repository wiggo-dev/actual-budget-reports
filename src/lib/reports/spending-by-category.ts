import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";

export type CategorySpendRow = {
  category: string;
  amount: number;
};

function periodRange(months: number): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end),
  };
}

export async function getSpendingByCategory(
  excludedAccountIds: string[],
  months = 1
): Promise<CategorySpendRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const categories = await actual.getCategories();
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name])
  );
  const { start, end } = periodRange(months);
  const totals = new Map<string, number>();

  for (const account of accounts) {
    const transactions = await actual.getTransactions(account.id, start, end);

    for (const tx of transactions) {
      if (tx.amount >= 0) {
        continue;
      }

      const categoryId =
        typeof tx.category === "string" ? tx.category : undefined;
      const category = categoryId
        ? (categoryNames.get(categoryId) ?? "Uncategorized")
        : "Uncategorized";
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
