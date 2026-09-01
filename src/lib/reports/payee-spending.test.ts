import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it } from "vitest";

import {
  rankPayeeSpend,
  type PayeeSpendTransaction,
} from "@/lib/reports/payee-spending";

describe("rankPayeeSpend", () => {
  it("ranks payees by spend for the included transactions and skips transfers/income", () => {
    const transactions: PayeeSpendTransaction[] = [
      fromPartial({
        id: "a",
        payeeId: "tesco",
        payeeName: "Tesco",
        amount: -40,
      }),
      fromPartial({
        id: "b",
        payeeId: "tesco",
        payeeName: "Tesco",
        amount: -10,
      }),
      fromPartial({
        id: "c",
        payeeId: "shell",
        payeeName: "Shell",
        amount: -60,
      }),
      fromPartial({
        id: "salary",
        payeeId: "acme",
        payeeName: "Acme",
        amount: 2000,
      }),
      fromPartial({
        id: "xfer-out",
        payeeId: "transfer-savings",
        payeeName: "Transfer: Savings",
        amount: -100,
        transferId: "xfer-in",
      }),
      fromPartial({
        id: "xfer-in",
        payeeId: "transfer-checking",
        payeeName: "Transfer: Checking",
        amount: 100,
        transferId: "xfer-out",
      }),
    ];

    expect(rankPayeeSpend(transactions)).toEqual([
      { payeeId: "shell", payee: "Shell", amount: 60 },
      { payeeId: "tesco", payee: "Tesco", amount: 50 },
    ]);
  });
});
