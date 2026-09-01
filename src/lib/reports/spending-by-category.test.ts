import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it } from "vitest";

import {
  aggregateCategorySpend,
  resolveCategoryName,
  resolveGroupName,
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

describe("resolveGroupName", () => {
  const groupNames = new Map([
    ["grp-food", "Food"],
    ["grp-fun", "Fun"],
  ]);
  const categoryGroupIndex = new Map([
    ["food", "grp-food"],
    ["fun", "grp-fun"],
  ]);

  it("maps category ids to their group name", () => {
    expect(resolveGroupName("food", categoryGroupIndex, groupNames)).toBe(
      "Food"
    );
  });

  it("falls back to Uncategorized for missing ids", () => {
    expect(resolveGroupName(undefined, categoryGroupIndex, groupNames)).toBe(
      "Uncategorized"
    );
    expect(resolveGroupName("unknown", categoryGroupIndex, groupNames)).toBe(
      "Uncategorized"
    );
  });
});

describe("aggregateCategorySpend", () => {
  const names = new Map([
    ["food", "Groceries"],
    ["fun", "Entertainment"],
    ["coffee", "Coffee"],
  ]);
  const groupNames = new Map([
    ["grp-food", "Food"],
    ["grp-fun", "Fun"],
  ]);
  const categoryGroupIndex = new Map([
    ["food", "grp-food"],
    ["fun", "grp-fun"],
    ["coffee", "grp-food"],
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

  it("skips excluded category ids", () => {
    const transactions: SpendTransaction[] = [
      fromPartial({ amount: -4000, category: "food" }),
      fromPartial({ amount: -2000, category: "fun" }),
    ];

    expect(
      aggregateCategorySpend(transactions, names, new Set(["food"]))
    ).toEqual([{ category: "Entertainment", amount: 20 }]);
  });

  it("rolls up spending by category group", () => {
    const transactions: SpendTransaction[] = [
      fromPartial({ amount: -4000, category: "food" }),
      fromPartial({ amount: -1000, category: "coffee" }),
      fromPartial({ amount: -2000, category: "fun" }),
    ];

    expect(
      aggregateCategorySpend(transactions, names, new Set(), {
        aggregation: "group",
        categoryGroupIndex,
        groupNames,
      })
    ).toEqual([
      { category: "Food", amount: 50 },
      { category: "Fun", amount: 20 },
    ]);
  });

  it("filters to a single group when groupId is set", () => {
    const transactions: SpendTransaction[] = [
      fromPartial({ amount: -4000, category: "food" }),
      fromPartial({ amount: -1000, category: "coffee" }),
      fromPartial({ amount: -2000, category: "fun" }),
    ];

    expect(
      aggregateCategorySpend(transactions, names, new Set(), {
        groupId: "grp-food",
        categoryGroupIndex,
        groupNames,
      })
    ).toEqual([
      { category: "Groceries", amount: 40 },
      { category: "Coffee", amount: 10 },
    ]);
  });
});
