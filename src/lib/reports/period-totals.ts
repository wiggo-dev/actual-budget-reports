export type PeriodTransaction = {
  id: string;
  accountId: string;
  /** Major currency units; positive is money in. */
  amount: number;
  transferId?: string | null;
};

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
    if (tx.transferId && ids.has(tx.transferId)) {
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
