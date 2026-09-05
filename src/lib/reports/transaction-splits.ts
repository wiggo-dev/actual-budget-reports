export type SplitChild = {
  id: string;
  amount: number;
  category?: unknown;
  payee?: unknown;
  transfer_id?: string | null;
};

export type TransactionWithSplits = {
  id: string;
  amount: number;
  category?: unknown;
  payee?: unknown;
  transfer_id?: string | null;
  subtransactions?: SplitChild[];
};

export type ExpandedTransaction<T extends TransactionWithSplits> = Omit<
  T,
  "subtransactions"
>;

export function expandSplitTransactions<T extends TransactionWithSplits>(
  transactions: T[]
): ExpandedTransaction<T>[] {
  const expanded: ExpandedTransaction<T>[] = [];

  for (const tx of transactions) {
    const subs = tx.subtransactions;
    if (subs && subs.length > 0) {
      const { subtransactions: _subtransactions, ...parent } = tx;
      for (const sub of subs) {
        expanded.push({
          ...parent,
          ...sub,
          id: sub.id,
        } as ExpandedTransaction<T>);
      }
      continue;
    }

    const { subtransactions: _subtransactions, ...rest } = tx;
    expanded.push(rest as ExpandedTransaction<T>);
  }

  return expanded;
}
