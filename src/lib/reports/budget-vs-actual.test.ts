import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it } from "vitest";

import { buildBudgetVsActualReport } from "@/lib/reports/budget-vs-actual";

describe("buildBudgetVsActualReport", () => {
  it("uses spent only from included-account transactions and follows the month window", () => {
    const report = buildBudgetVsActualReport([
      {
        month: "2026-01",
        categories: [
          fromPartial({
            categoryId: "food",
            category: "Food",
            budgeted: 400,
          }),
          fromPartial({
            categoryId: "rent",
            category: "Rent",
            budgeted: 1200,
          }),
        ],
        transactions: [
          fromPartial({
            id: "food-included",
            categoryId: "food",
            categoryName: "Food",
            amount: -80,
          }),
          fromPartial({
            id: "food-also",
            categoryId: "food",
            categoryName: "Food",
            amount: -20,
          }),
        ],
      },
      {
        month: "2026-02",
        categories: [
          fromPartial({
            categoryId: "food",
            category: "Food",
            budgeted: 400,
          }),
          fromPartial({
            categoryId: "rent",
            category: "Rent",
            budgeted: 1200,
          }),
        ],
        transactions: [
          fromPartial({
            id: "food-feb",
            categoryId: "food",
            categoryName: "Food",
            amount: -50,
          }),
          fromPartial({
            id: "rent-feb",
            categoryId: "rent",
            categoryName: "Rent",
            amount: -1200,
          }),
        ],
      },
    ]);

    expect(report.categories).toEqual([
      {
        category: "Rent",
        budgeted: 2400,
        spent: 1200,
        balance: 1200,
      },
      {
        category: "Food",
        budgeted: 800,
        spent: 150,
        balance: 650,
      },
    ]);

    expect(report.history).toEqual([
      { month: "2026-01", budgeted: 1600, spent: 100 },
      { month: "2026-02", budgeted: 1600, spent: 1250 },
    ]);
  });

  it("keeps uncategorized spend in later months of the window", () => {
    const report = buildBudgetVsActualReport([
      {
        month: "2026-01",
        categories: [],
        transactions: [
          fromPartial({
            id: "misc-1",
            categoryName: "Uncategorized",
            amount: -10,
          }),
        ],
      },
      {
        month: "2026-02",
        categories: [],
        transactions: [
          fromPartial({
            id: "misc-2",
            categoryName: "Uncategorized",
            amount: -25,
          }),
        ],
      },
    ]);

    expect(report.categories).toEqual([
      {
        category: "Uncategorized",
        budgeted: 0,
        spent: 35,
        balance: -35,
      },
    ]);
    expect(report.history).toEqual([
      { month: "2026-01", budgeted: 0, spent: 10 },
      { month: "2026-02", budgeted: 0, spent: 25 },
    ]);
  });

  it("ignores internal transfers when computing spent", () => {
    const report = buildBudgetVsActualReport([
      {
        month: "2026-01",
        categories: [
          fromPartial({
            categoryId: "food",
            category: "Food",
            budgeted: 100,
          }),
        ],
        transactions: [
          fromPartial({
            id: "xfer-out",
            categoryId: "food",
            categoryName: "Food",
            amount: -40,
            transferId: "xfer-in",
          }),
          fromPartial({
            id: "xfer-in",
            categoryId: "food",
            categoryName: "Food",
            amount: 40,
            transferId: "xfer-out",
          }),
          fromPartial({
            id: "groceries",
            categoryId: "food",
            categoryName: "Food",
            amount: -30,
          }),
        ],
      },
    ]);

    expect(report.categories).toEqual([
      {
        category: "Food",
        budgeted: 100,
        spent: 30,
        balance: 70,
      },
    ]);
  });
});
