import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount, monthKey } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";
import { monthsInWindow, type MonthWindow } from "@/lib/reports/timeframe";

export type CashFlowPoint = {
  month: string;
  inflow: number;
  outflow: number;
};

export async function getCashFlow(
  excludedAccountIds: string[],
  window: MonthWindow = { count: 12, endOffset: 0 }
): Promise<CashFlowPoint[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const monthStarts = monthsInWindow(window);
  const points: CashFlowPoint[] = [];

  for (const monthStart of monthStarts) {
    const start = formatLocalDate(monthStart);
    const end = formatLocalDate(
      new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    );
    let inflow = 0;
    let outflow = 0;

    for (const account of accounts) {
      const transactions = await actual.getTransactions(account.id, start, end);

      for (const tx of transactions) {
        const amount = integerToAmount(tx.amount);
        if (amount >= 0) {
          inflow += amount;
        } else {
          outflow += Math.abs(amount);
        }
      }
    }

    points.push({
      month: monthKey(monthStart),
      inflow,
      outflow,
    });
  }

  return points;
}
