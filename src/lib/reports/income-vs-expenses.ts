import { getIncomeExpenseRange } from "@/lib/reports/net-worth";

export type IncomeExpensePoint = {
  month: string;
  income: number;
  expenses: number;
};

export async function getIncomeVsExpenses(
  excludedAccountIds: string[],
  months = 12
): Promise<IncomeExpensePoint[]> {
  return getIncomeExpenseRange(excludedAccountIds, months);
}
