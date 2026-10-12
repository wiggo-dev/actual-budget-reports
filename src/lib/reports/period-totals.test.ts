import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it } from "vitest";

import {
  isPairedTransfer,
  summarizeFlows,
  type PeriodTransaction,
} from "@/lib/reports/period-totals";

describe("isPairedTransfer", () => {
  it("is true only when the counterpart id is in the included set", () => {
    const ids = new Set(["xfer-in", "rent"]);
    expect(isPairedTransfer("xfer-in", ids)).toBe(true);
    expect(isPairedTransfer("missing", ids)).toBe(false);
    expect(isPairedTransfer(null, ids)).toBe(false);
    expect(isPairedTransfer(undefined, ids)).toBe(false);
  });
});

describe("summarizeFlows", () => {
  it("does not count transfers between included accounts as inflow or outflow", () => {
    const transactions: PeriodTransaction[] = [
      fromPartial({
        id: "salary",
        accountId: "checking",
        amount: 3000,
      }),
      fromPartial({
        id: "rent",
        accountId: "checking",
        amount: -1200,
      }),
      fromPartial({
        id: "xfer-out",
        accountId: "checking",
        amount: -500,
        transferId: "xfer-in",
      }),
      fromPartial({
        id: "xfer-in",
        accountId: "savings",
        amount: 500,
        transferId: "xfer-out",
      }),
    ];

    expect(summarizeFlows(transactions)).toEqual({
      inflow: 3000,
      outflow: 1200,
    });
  });

  it("counts a transfer whose counterpart is outside the included set", () => {
    const transactions: PeriodTransaction[] = [
      fromPartial({
        id: "to-excluded",
        accountId: "checking",
        amount: -200,
        transferId: "excluded-leg",
      }),
      fromPartial({
        id: "from-excluded",
        accountId: "checking",
        amount: 75,
        transferId: "excluded-leg-in",
      }),
    ];

    expect(summarizeFlows(transactions)).toEqual({
      inflow: 75,
      outflow: 200,
    });
  });
});
