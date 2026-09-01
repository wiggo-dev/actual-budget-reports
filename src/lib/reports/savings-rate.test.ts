import { describe, expect, it } from "vitest";

import { monthlySavingsRates, savingsRate } from "@/lib/reports/savings-rate";

describe("savingsRate", () => {
  it("returns (income - expenses) / income when income is positive", () => {
    expect(savingsRate(2000, 1500)).toBe(0.25);
  });

  it("returns null when income is zero or missing so UI can avoid a fake percent", () => {
    expect(savingsRate(0, 100)).toBeNull();
    expect(savingsRate(-50, 10)).toBeNull();
  });
});

describe("monthlySavingsRates", () => {
  it("maps each month to a rate or null", () => {
    expect(
      monthlySavingsRates([
        { month: "2026-01", income: 2000, expenses: 1000 },
        { month: "2026-02", income: 0, expenses: 50 },
        { month: "2026-03", income: 1000, expenses: 1200 },
      ])
    ).toEqual([
      { month: "2026-01", rate: 0.5 },
      { month: "2026-02", rate: null },
      { month: "2026-03", rate: -0.2 },
    ]);
  });
});
