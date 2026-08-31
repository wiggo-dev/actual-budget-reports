import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount, monthKey } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";

export type NetWorthPoint = {
  month: string;
  netWorth: number;
};

function monthsBack(count: number): Date[] {
  const now = new Date();
  const months: Date[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  return months;
}

export async function getNetWorthSeries(
  excludedAccountIds: string[],
  months = 12
): Promise<NetWorthPoint[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const monthStarts = monthsBack(months);
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
  months = 12
) {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const monthStarts = monthsBack(months);
  const points: { month: string; income: number; expenses: number }[] = [];

  for (const monthStart of monthStarts) {
    const start = formatLocalDate(monthStart);
    const end = formatLocalDate(
      new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    );
    let income = 0;
    let expenses = 0;

    for (const account of accounts) {
      const transactions = await actual.getTransactions(account.id, start, end);

      for (const tx of transactions) {
        const amount = integerToAmount(tx.amount);
        if (amount >= 0) {
          income += amount;
        } else {
          expenses += Math.abs(amount);
        }
      }
    }

    points.push({
      month: monthKey(monthStart),
      income,
      expenses,
    });
  }

  return points;
}
