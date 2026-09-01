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

export type NetWorthCompositionPoint = NetWorthPoint & {
  onBudget: number;
  offBudget: number;
};

export async function getNetWorthSeries(
  excludedAccountIds: string[],
  range: ReportRange = defaultRange
): Promise<NetWorthCompositionPoint[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const monthStarts = monthStartsForRange(range);
  const points: NetWorthCompositionPoint[] = [];

  for (const monthStart of monthStarts) {
    const cutoff = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    );
    let onBudget = 0;
    let offBudget = 0;

    for (const account of accounts) {
      const balance = integerToAmount(
        await actual.getAccountBalance(account.id, cutoff)
      );

      if (account.offbudget) {
        offBudget += balance;
      } else {
        onBudget += balance;
      }
    }

    points.push({
      month: monthKey(monthStart),
      onBudget,
      offBudget,
      netWorth: onBudget + offBudget,
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
