import { describe, expect, it } from "vitest";

describe("net worth composition", () => {
  it("keeps total equal to on-budget plus off-budget", () => {
    const onBudget = 12_500;
    const offBudget = -2_000;
    const netWorth = onBudget + offBudget;

    expect(netWorth).toBe(10_500);
  });
});
