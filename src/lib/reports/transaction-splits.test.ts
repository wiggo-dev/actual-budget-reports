import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it } from "vitest";

import {
  expandSplitTransactions,
  type TransactionWithSplits,
} from "@/lib/reports/transaction-splits";

describe("expandSplitTransactions", () => {
  it("returns non-split transactions unchanged", () => {
    const transactions: TransactionWithSplits[] = [
      fromPartial({
        id: "tx-1",
        amount: -5000,
        category: "food",
        payee: "store",
      }),
    ];

    expect(expandSplitTransactions(transactions)).toEqual([
      {
        id: "tx-1",
        amount: -5000,
        category: "food",
        payee: "store",
      },
    ]);
  });

  it("expands split parents into their subtransactions", () => {
    const transactions: TransactionWithSplits[] = [
      fromPartial({
        id: "parent",
        amount: -10000,
        category: null,
        payee: "costco",
        subtransactions: [
          fromPartial({
            id: "child-1",
            amount: -6000,
            category: "food",
            payee: null,
          }),
          fromPartial({
            id: "child-2",
            amount: -4000,
            category: "household",
            payee: null,
          }),
        ],
      }),
    ];

    expect(expandSplitTransactions(transactions)).toEqual([
      {
        id: "child-1",
        amount: -6000,
        category: "food",
        payee: null,
      },
      {
        id: "child-2",
        amount: -4000,
        category: "household",
        payee: null,
      },
    ]);
  });

  it("preserves parent payee when a split child has no payee", () => {
    const transactions: TransactionWithSplits[] = [
      fromPartial({
        id: "parent",
        amount: -5000,
        payee: "costco",
        subtransactions: [
          fromPartial({
            id: "child-1",
            amount: -5000,
            category: "food",
          }),
        ],
      }),
    ];

    expect(expandSplitTransactions(transactions)[0]?.payee).toBe("costco");
  });
});
