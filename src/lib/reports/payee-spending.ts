import { actual } from "@/lib/actual/client";
import { formatLocalDate, integerToAmount } from "@/lib/format";
import {
  buildCategoryGroupIndex,
  buildExcludedCategoryIdSet,
  isCategoryExcluded,
} from "@/lib/reports/category-filter";
import { filterAccounts, type ReportFilters } from "@/lib/reports/filters";
import {
  dateBoundsForRange,
  type ReportRange,
} from "@/lib/reports/report-range";
import { isPairedTransfer } from "@/lib/reports/period-totals";
import { expandSplitTransactions } from "@/lib/reports/transaction-splits";

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
  transactions: PayeeSpendTransaction[],
  excludedCategoryIds: Set<string> = new Set(),
  categoryByTxId: Map<string, string | undefined> = new Map()
): PayeeSpendRow[] {
  const ids = new Set(transactions.map((tx) => tx.id));
  const totals = new Map<string, PayeeSpendRow>();

  for (const tx of transactions) {
    if (isCategoryExcluded(categoryByTxId.get(tx.id), excludedCategoryIds)) {
      continue;
    }
    if (isPairedTransfer(tx.transferId, ids)) {
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
  filters: ReportFilters,
  range: ReportRange = { kind: "preset", window: { count: 1, endOffset: 0 } }
): Promise<PayeeSpendRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    filters.excludedAccountIds
  );
  const categories = await actual.getCategories();
  const categoryGroupIndex = buildCategoryGroupIndex(
    categories.map((category) => ({
      id: category.id,
      groupId: category.group_id,
    }))
  );
  const excludedCategoryIds = buildExcludedCategoryIdSet(
    filters,
    categoryGroupIndex
  );
  const payeeNames = new Map(
    (await actual.getPayees()).map((payee) => [payee.id, payee.name])
  );
  const { start, end } = dateBoundsForRange(range);
  const transactions: PayeeSpendTransaction[] = [];
  const categoryByTxId = new Map<string, string | undefined>();

  for (const account of accounts) {
    const accountTxs = await actual.getTransactions(account.id, start, end);
    for (const tx of expandSplitTransactions(accountTxs)) {
      const payeeId = typeof tx.payee === "string" ? tx.payee : null;
      const categoryId =
        typeof tx.category === "string" ? tx.category : undefined;
      categoryByTxId.set(tx.id, categoryId);
      transactions.push({
        id: tx.id,
        payeeId,
        payeeName: payeeId ? (payeeNames.get(payeeId) ?? "Unknown") : "Unknown",
        amount: integerToAmount(tx.amount),
        transferId: tx.transfer_id,
      });
    }
  }

  return rankPayeeSpend(transactions, excludedCategoryIds, categoryByTxId);
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
  filters: ReportFilters,
  range: ReportRange,
  filterOptions: TransactionListFilters = {}
): Promise<TransactionListRow[]> {
  const accounts = filterAccounts(
    await actual.getAccounts(),
    filters.excludedAccountIds
  );
  const categories = await actual.getCategories();
  const categoryGroupIndex = buildCategoryGroupIndex(
    categories.map((category) => ({
      id: category.id,
      groupId: category.group_id,
    }))
  );
  const excludedCategoryIds = buildExcludedCategoryIdSet(
    filters,
    categoryGroupIndex
  );
  const accountNames = new Map(
    accounts.map((account) => [account.id, account.name])
  );
  const payeeNames = new Map(
    (await actual.getPayees()).map((payee) => [payee.id, payee.name])
  );
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name])
  );

  let { start, end } = dateBoundsForRange(range);
  if (filterOptions.month) {
    const [year, month] = filterOptions.month.split("-").map(Number);
    if (year && month) {
      start = formatLocalDate(new Date(year, month - 1, 1));
      end = formatLocalDate(new Date(year, month, 0));
    }
  }

  type ExpandedRow = ReturnType<typeof expandSplitTransactions>[number] & {
    accountId: string;
    date: string;
  };
  const expanded: ExpandedRow[] = [];
  for (const account of accounts) {
    const accountTxs = await actual.getTransactions(account.id, start, end);
    for (const tx of expandSplitTransactions(accountTxs)) {
      expanded.push({ ...tx, accountId: account.id, date: tx.date });
    }
  }

  const includedIds = new Set(expanded.map((tx) => tx.id));
  const rows: TransactionListRow[] = [];
  const seen = new Set<string>();

  for (const tx of expanded) {
    if (seen.has(tx.id)) {
      continue;
    }
    seen.add(tx.id);

    if (isPairedTransfer(tx.transfer_id, includedIds)) {
      continue;
    }

    const payeeId = typeof tx.payee === "string" ? tx.payee : null;
    const payeeName = payeeId
      ? (payeeNames.get(payeeId) ?? "Unknown")
      : "Unknown";
    const categoryId =
      typeof tx.category === "string" ? tx.category : undefined;
    if (isCategoryExcluded(categoryId, excludedCategoryIds)) {
      continue;
    }
    const categoryName = categoryId
      ? (categoryNames.get(categoryId) ?? "Uncategorized")
      : "Uncategorized";

    if (filterOptions.payeeId && payeeId !== filterOptions.payeeId) {
      continue;
    }
    if (
      !filterOptions.payeeId &&
      filterOptions.payeeName &&
      payeeName !== filterOptions.payeeName
    ) {
      continue;
    }
    if (filterOptions.category && categoryName !== filterOptions.category) {
      continue;
    }

    rows.push({
      id: tx.id,
      date: tx.date,
      payee: payeeName,
      category: categoryName,
      account: accountNames.get(tx.accountId) ?? "Unknown",
      amount: integerToAmount(tx.amount),
    });
  }

  return rows.sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );
}
