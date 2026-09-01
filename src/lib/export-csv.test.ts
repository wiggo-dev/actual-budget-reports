import { describe, expect, it } from "vitest";

import {
  buildExportFilename,
  escapeCsvCell,
  joinCsvSections,
  rowsToCsv,
} from "@/lib/export-csv";
import {
  incomeVsExpensesToCsv,
  spendingMixToCsv,
  spendingTrendToCsv,
} from "@/lib/report-export";

describe("escapeCsvCell", () => {
  it("quotes values that contain commas or quotes", () => {
    expect(escapeCsvCell('Groceries, "fresh"')).toBe('"Groceries, ""fresh"""');
  });

  it("leaves plain values unquoted", () => {
    expect(escapeCsvCell("Groceries")).toBe("Groceries");
    expect(escapeCsvCell(42.5)).toBe("42.5");
  });
});

describe("rowsToCsv", () => {
  it("builds a header row and data rows", () => {
    expect(
      rowsToCsv(
        ["month", "amount"],
        [
          ["2026-01", 10],
          ["2026-02", 20],
        ]
      )
    ).toBe("month,amount\n2026-01,10\n2026-02,20");
  });
});

describe("joinCsvSections", () => {
  it("separates sections with titled comment headers", () => {
    expect(
      joinCsvSections([
        { title: "Mix", csv: "category,amount\nFood,10" },
        { title: "Trend", csv: "month,total\n2026-01,10" },
      ])
    ).toBe(
      "# Mix\ncategory,amount\nFood,10\n\n# Trend\nmonth,total\n2026-01,10"
    );
  });
});

describe("buildExportFilename", () => {
  it("includes the view and a slugged timeframe label", () => {
    expect(buildExportFilename("net-worth", "12 months")).toMatch(
      /^actual-reports-net-worth-12-months-\d{4}-\d{2}-\d{2}\.csv$/
    );
  });
});

describe("report serializers", () => {
  it("serializes spending mix rows", () => {
    expect(
      spendingMixToCsv([
        { category: "Food", amount: 55.5 },
        { category: "Fun", amount: 20 },
      ])
    ).toBe("category,amount\nFood,55.5\nFun,20");
  });

  it("serializes spending trend as wide month columns", () => {
    expect(
      spendingTrendToCsv({
        categories: ["Food", "Fun"],
        points: [{ month: "2026-01", Food: 10, Fun: 5, total: 15 }],
      })
    ).toBe("month,Food,Fun,total\n2026-01,10,5,15");
  });

  it("serializes income vs expenses", () => {
    expect(
      incomeVsExpensesToCsv([
        { month: "2026-01", income: 2000, expenses: 1500 },
      ])
    ).toBe("month,income,expenses\n2026-01,2000,1500");
  });
});
