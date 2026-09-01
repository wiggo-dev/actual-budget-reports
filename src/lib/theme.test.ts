import { describe, expect, it } from "vitest";

import { resolveThemeClass } from "@/lib/theme";

describe("resolveThemeClass", () => {
  it("keeps light as default", () => {
    expect(resolveThemeClass("light", true)).toBe("light");
    expect(resolveThemeClass("light", false)).toBe("light");
  });

  it("forces dark mode", () => {
    expect(resolveThemeClass("dark", false)).toBe("dark");
  });

  it("follows system preference when set to system", () => {
    expect(resolveThemeClass("system", true)).toBe("dark");
    expect(resolveThemeClass("system", false)).toBe("light");
  });
});
