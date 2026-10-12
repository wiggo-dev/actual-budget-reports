export type PeriodTransaction = {
  id: string;
  accountId: string;
  /** Major currency units; positive is money in. */
  amount: number;
  transferId?: string | null;
};

/**
 * True when the counterpart of a transfer is also in `includedIds`.
 * Moving money between included accounts is not income, expense, or spend.
 */
export function isPairedTransfer(
  transferId: string | null | undefined,
  includedIds: Set<string>
): boolean {
  return Boolean(transferId && includedIds.has(transferId));
}

/**
 * Sum inflow/outflow for transactions already scoped to included accounts.
 * Legs of a transfer whose counterpart is also in the set are ignored so
 * moving money between included accounts does not inflate totals.
 */
export function summarizeFlows(transactions: PeriodTransaction[]): {
  inflow: number;
  outflow: number;
} {
  const ids = new Set(transactions.map((tx) => tx.id));
  let inflow = 0;
  let outflow = 0;

  for (const tx of transactions) {
    if (isPairedTransfer(tx.transferId, ids)) {
      continue;
    }

    if (tx.amount >= 0) {
      inflow += tx.amount;
    } else {
      outflow += Math.abs(tx.amount);
    }
  }

  return { inflow, outflow };
}
