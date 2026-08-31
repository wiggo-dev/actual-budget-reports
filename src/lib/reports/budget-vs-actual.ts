import { actual } from "@/lib/actual/client";
import { integerToAmount, monthKey } from "@/lib/format";

export type BudgetActualRow = {
  category: string;
  budgeted: number;
  spent: number;
  balance: number;
};

type CategoryRow = {
  name?: string;
  budgeted?: number;
  spent?: number;
  balance?: number;
};

export async function getBudgetVsActual(
  _excludedAccountIds: string[]
): Promise<BudgetActualRow[]> {
  const month = monthKey(new Date());
  const budget = await actual.getBudgetMonth(month);
  const rows: BudgetActualRow[] = [];

  for (const group of budget.categoryGroups) {
    for (const category of group.categories ?? []) {
      const row = category as CategoryRow;
      const budgeted = integerToAmount(row.budgeted ?? 0);
      const spent = integerToAmount(Math.abs(row.spent ?? 0));
      const balance = integerToAmount(row.balance ?? 0);

      if (budgeted === 0 && spent === 0) {
        continue;
      }

      rows.push({
        category: row.name ?? "Unknown",
        budgeted,
        spent,
        balance,
      });
    }
  }

  return rows.sort((a, b) => b.spent - a.spent);
}
