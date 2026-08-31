import { getIncomeExpenseRange } from "@/lib/reports/net-worth";
import type { MonthWindow } from "@/lib/reports/timeframe";

export type IncomeExpensePoint = {
  month: string;
  income: number;
  expenses: number;
};

export async function getIncomeVsExpenses(
  excludedAccountIds: string[],
  window: MonthWindow = { count: 12, endOffset: 0 }
): Promise<IncomeExpensePoint[]> {
  return getIncomeExpenseRange(excludedAccountIds, window);
}
