import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount, monthKey } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";
import { summarizeFlows } from "@/lib/reports/period-totals";
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
    const periodTxs = [];

    for (const account of accounts) {
      const transactions = await actual.getTransactions(account.id, start, end);

      for (const tx of transactions) {
        periodTxs.push({
          id: tx.id,
          accountId: account.id,
          amount: integerToAmount(tx.amount),
          transferId: tx.transfer_id,
        });
      }
    }

    const { inflow, outflow } = summarizeFlows(periodTxs);
    points.push({
      month: monthKey(monthStart),
      inflow,
      outflow,
    });
  }

  return points;
}
