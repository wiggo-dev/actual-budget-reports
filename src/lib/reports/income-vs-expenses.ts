import { getIncomeExpenseRange } from "@/lib/reports/net-worth";
import type { ReportRange } from "@/lib/reports/report-range";

export type IncomeExpensePoint = {
  month: string;
  income: number;
  expenses: number;
};

export async function getIncomeVsExpenses(
  excludedAccountIds: string[],
  range: ReportRange = {
    kind: "preset",
    window: { count: 12, endOffset: 0 },
  }
): Promise<IncomeExpensePoint[]> {
  return getIncomeExpenseRange(excludedAccountIds, range);
}
