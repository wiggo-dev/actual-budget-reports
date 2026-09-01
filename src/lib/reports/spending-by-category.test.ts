import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it } from "vitest";

import {
  aggregateCategorySpend,
  resolveCategoryName,
  type SpendTransaction,
} from "@/lib/reports/spending-by-category";

describe("resolveCategoryName", () => {
  const names = new Map([
    ["food", "Groceries"],
    ["fun", "Entertainment"],
  ]);

  it("uses the category map when the id is known", () => {
    expect(resolveCategoryName("food", names)).toBe("Groceries");
  });

  it("falls back to Uncategorized for missing or non-string ids", () => {
    expect(resolveCategoryName(undefined, names)).toBe("Uncategorized");
    expect(resolveCategoryName("unknown", names)).toBe("Uncategorized");
  });
});

describe("aggregateCategorySpend", () => {
  const names = new Map([
    ["food", "Groceries"],
    ["fun", "Entertainment"],
  ]);

  it("sums spending by category and ignores inflows", () => {
    const transactions: SpendTransaction[] = [
      fromPartial({ amount: -4000, category: "food" }),
      fromPartial({ amount: -1500, category: "food" }),
      fromPartial({ amount: -2000, category: "fun" }),
      fromPartial({ amount: 50000, category: "food" }),
      fromPartial({ amount: -750, category: null }),
      fromPartial({ amount: -250, category: "missing-id" }),
    ];

    expect(aggregateCategorySpend(transactions, names)).toEqual([
      { category: "Groceries", amount: 55 },
      { category: "Entertainment", amount: 20 },
      { category: "Uncategorized", amount: 10 },
    ]);
  });
});
