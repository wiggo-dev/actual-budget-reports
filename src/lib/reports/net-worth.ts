import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount, monthKey } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";
import { summarizeFlows } from "@/lib/reports/period-totals";
import {
  monthStartsForRange,
  type ReportRange,
} from "@/lib/reports/report-range";

const defaultRange: ReportRange = {
  kind: "preset",
  window: { count: 12, endOffset: 0 },
};

export type NetWorthPoint = {
  month: string;
  netWorth: number;
};

export async function getNetWorthSeries(
  excludedAccountIds: string[],
  range: ReportRange = defaultRange
): Promise<NetWorthPoint[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const monthStarts = monthStartsForRange(range);
  const points: NetWorthPoint[] = [];

  for (const monthStart of monthStarts) {
    const cutoff = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    );
    let total = 0;

    for (const account of accounts) {
      const balance = await actual.getAccountBalance(account.id, cutoff);
      total += integerToAmount(balance);
    }

    points.push({
      month: monthKey(monthStart),
      netWorth: total,
    });
  }

  return points;
}

export async function getIncomeExpenseRange(
  excludedAccountIds: string[],
  range: ReportRange = defaultRange
) {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const monthStarts = monthStartsForRange(range);
  const points: { month: string; income: number; expenses: number }[] = [];

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
      income: inflow,
      expenses: outflow,
    });
  }

  return points;
}
