import { describe, expect, it } from "vitest";

import {
  filterAccounts,
  parseExcludedIds,
  parseReportWindow,
} from "@/lib/reports/filters";

describe("filterAccounts", () => {
  it("removes excluded account ids", () => {
    const accounts = [
      { id: "a", name: "Checking" },
      { id: "b", name: "Savings" },
      { id: "c", name: "Credit" },
    ];

    expect(filterAccounts(accounts, ["b"])).toEqual([
      { id: "a", name: "Checking" },
      { id: "c", name: "Credit" },
    ]);
  });
});

describe("parseExcludedIds", () => {
  it("prefers repeated excludedAccountIds params over csv excluded", () => {
    const params = new URLSearchParams();
    params.append("excludedAccountIds", "a");
    params.append("excludedAccountIds", "b");
    params.set("excluded", "c,d");

    expect(parseExcludedIds(params)).toEqual(["a", "b"]);
  });

  it("parses comma-separated excluded ids", () => {
    const params = new URLSearchParams("excluded=a, b ,,c");
    expect(parseExcludedIds(params)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty list when no exclude params are present", () => {
    expect(parseExcludedIds(new URLSearchParams())).toEqual([]);
  });
});

describe("parseReportWindow", () => {
  it("uses timeframe when present", () => {
    const params = new URLSearchParams("timeframe=6m");
    expect(parseReportWindow(params)).toEqual({ count: 6, endOffset: 0 });
  });

  it("maps months=all to the all-time window", () => {
    const params = new URLSearchParams("months=all");
    expect(parseReportWindow(params)).toEqual({ count: 120, endOffset: 0 });
  });

  it("caps numeric months at 120 and falls back on invalid values", () => {
    expect(parseReportWindow(new URLSearchParams("months=999"))).toEqual({
      count: 120,
      endOffset: 0,
    });
    expect(parseReportWindow(new URLSearchParams("months=abc"), 6)).toEqual({
      count: 6,
      endOffset: 0,
    });
  });
});
