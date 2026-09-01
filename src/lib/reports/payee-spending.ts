import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount } from "@/lib/format";
import { filterAccounts } from "@/lib/reports/filters";
import { dateRangeForWindow, type MonthWindow } from "@/lib/reports/timeframe";

export type PayeeSpendTransaction = {
  id: string;
  payeeId?: string | null;
  payeeName: string;
  amount: number;
  transferId?: string | null;
};

export type PayeeSpendRow = {
  payeeId: string | null;
  payee: string;
  amount: number;
};

export function rankPayeeSpend(
  transactions: PayeeSpendTransaction[]
): PayeeSpendRow[] {
  const ids = new Set(transactions.map((tx) => tx.id));
  const totals = new Map<string, PayeeSpendRow>();

  for (const tx of transactions) {
    if (tx.transferId && ids.has(tx.transferId)) {
      continue;
    }
    if (tx.amount >= 0) {
      continue;
    }

    const key = tx.payeeId ?? (tx.payeeName || "Unknown");
    const current = totals.get(key) ?? {
      payeeId: tx.payeeId ?? null,
      payee: tx.payeeName || "Unknown",
      amount: 0,
    };
    current.amount += Math.abs(tx.amount);
    totals.set(key, current);
  }

  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}

export async function getPayeeSpending(
  excludedAccountIds: string[],
  window: MonthWindow = { count: 1, endOffset: 0 }
): Promise<PayeeSpendRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const payeeNames = new Map(
    (await actual.getPayees()).map((payee) => [payee.id, payee.name])
  );
  const { start, end } = dateRangeForWindow(window);
  const transactions: PayeeSpendTransaction[] = [];

  for (const account of accounts) {
    const accountTxs = await actual.getTransactions(account.id, start, end);
    for (const tx of accountTxs) {
      const payeeId = typeof tx.payee === "string" ? tx.payee : null;
      transactions.push({
        id: tx.id,
        payeeId,
        payeeName: payeeId ? (payeeNames.get(payeeId) ?? "Unknown") : "Unknown",
        amount: integerToAmount(tx.amount),
        transferId: tx.transfer_id,
      });
    }
  }

  return rankPayeeSpend(transactions);
}

export type TransactionListRow = {
  id: string;
  date: string;
  payee: string;
  category: string;
  account: string;
  amount: number;
};

export type TransactionListFilters = {
  payeeId?: string | null;
  payeeName?: string | null;
  category?: string | null;
  month?: string | null;
};

export async function getFilteredTransactions(
  excludedAccountIds: string[],
  window: MonthWindow,
  filters: TransactionListFilters = {}
): Promise<TransactionListRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    excludedAccountIds
  );
  const accountNames = new Map(
    accounts.map((account) => [account.id, account.name])
  );
  const payeeNames = new Map(
    (await actual.getPayees()).map((payee) => [payee.id, payee.name])
  );
  const categoryNames = new Map(
    (await actual.getCategories()).map((category) => [
      category.id,
      category.name,
    ])
  );

  let { start, end } = dateRangeForWindow(window);
  if (filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    if (year && month) {
      start = formatLocalDate(new Date(year, month - 1, 1));
      end = formatLocalDate(new Date(year, month, 0));
    }
  }

  const rows: TransactionListRow[] = [];
  const seen = new Set<string>();

  for (const account of accounts) {
    const accountTxs = await actual.getTransactions(account.id, start, end);
    for (const tx of accountTxs) {
      if (seen.has(tx.id)) {
        continue;
      }
      seen.add(tx.id);

      if (tx.transfer_id) {
        // Still show transfers in drill-down when explicitly filtering;
        // ranking excludes them, but investigators may want the legs.
      }

      const payeeId = typeof tx.payee === "string" ? tx.payee : null;
      const payeeName = payeeId
        ? (payeeNames.get(payeeId) ?? "Unknown")
        : "Unknown";
      const categoryId =
        typeof tx.category === "string" ? tx.category : undefined;
      const categoryName = categoryId
        ? (categoryNames.get(categoryId) ?? "Uncategorized")
        : "Uncategorized";

      if (filters.payeeId && payeeId !== filters.payeeId) {
        continue;
      }
      if (
        !filters.payeeId &&
        filters.payeeName &&
        payeeName !== filters.payeeName
      ) {
        continue;
      }
      if (filters.category && categoryName !== filters.category) {
        continue;
      }

      rows.push({
        id: tx.id,
        date: tx.date,
        payee: payeeName,
        category: categoryName,
        account: accountNames.get(account.id) ?? "Unknown",
        amount: integerToAmount(tx.amount),
      });
    }
  }

  return rows.sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );
}
