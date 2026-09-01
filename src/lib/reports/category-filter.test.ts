import { describe, expect, it } from "vitest";

import {
  buildCategoryGroupIndex,
  buildExcludedCategoryIdSet,
  isCategoryExcluded,
  parseExcludedCategoryGroupIds,
  parseExcludedCategoryIds,
} from "@/lib/reports/category-filter";

describe("buildExcludedCategoryIdSet", () => {
  const index = buildCategoryGroupIndex([
    { id: "food", groupId: "living" },
    { id: "rent", groupId: "living" },
    { id: "salary", groupId: "income" },
  ]);

  it("includes individually excluded categories", () => {
    expect(
      buildExcludedCategoryIdSet(
        {
          excludedCategoryIds: ["food"],
          excludedCategoryGroupIds: [],
        },
        index
      )
    ).toEqual(new Set(["food"]));
  });

  it("expands excluded groups to all member categories", () => {
    expect(
      buildExcludedCategoryIdSet(
        {
          excludedCategoryIds: [],
          excludedCategoryGroupIds: ["living"],
        },
        index
      )
    ).toEqual(new Set(["food", "rent"]));
  });

  it("merges direct and group exclusions", () => {
    expect(
      buildExcludedCategoryIdSet(
        {
          excludedCategoryIds: ["salary"],
          excludedCategoryGroupIds: ["living"],
        },
        index
      )
    ).toEqual(new Set(["food", "rent", "salary"]));
  });
});

describe("isCategoryExcluded", () => {
  const excluded = new Set(["food"]);

  it("treats missing category ids as included", () => {
    expect(isCategoryExcluded(undefined, excluded)).toBe(false);
  });

  it("matches excluded category ids", () => {
    expect(isCategoryExcluded("food", excluded)).toBe(true);
    expect(isCategoryExcluded("rent", excluded)).toBe(false);
  });
});

describe("parseExcludedCategoryIds", () => {
  it("prefers repeated params over csv", () => {
    const params = new URLSearchParams();
    params.append("excludedCategoryIds", "a");
    params.append("excludedCategoryIds", "b");
    params.set("excludedCategories", "c");

    expect(parseExcludedCategoryIds(params)).toEqual(["a", "b"]);
  });

  it("parses comma-separated excludedCategories", () => {
    const params = new URLSearchParams("excludedCategories=a, b ,,c");
    expect(parseExcludedCategoryIds(params)).toEqual(["a", "b", "c"]);
  });
});

describe("parseExcludedCategoryGroupIds", () => {
  it("prefers repeated params over csv", () => {
    const params = new URLSearchParams();
    params.append("excludedCategoryGroupIds", "g1");
    params.set("excludedCategoryGroups", "g2");

    expect(parseExcludedCategoryGroupIds(params)).toEqual(["g1"]);
  });
});
