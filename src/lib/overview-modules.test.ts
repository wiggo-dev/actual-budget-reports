import { describe, expect, it } from "vitest";

import {
  isOverviewModuleVisible,
  OVERVIEW_MODULE_IDS,
} from "@/lib/overview-modules";

describe("overview modules", () => {
  it("shows all modules by default", () => {
    for (const id of OVERVIEW_MODULE_IDS) {
      expect(isOverviewModuleVisible(id, [])).toBe(true);
    }
  });

  it("hides listed modules", () => {
    expect(isOverviewModuleVisible("cash-flow", ["cash-flow"])).toBe(false);
  });
});
