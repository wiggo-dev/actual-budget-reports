import { describe, expect, it } from "vitest";

import {
  compareActualVersions,
  majorMinorVersion,
} from "@/lib/actual/versions";

describe("majorMinorVersion", () => {
  it("extracts major.minor from semver strings", () => {
    expect(majorMinorVersion("26.8.1")).toBe("26.8");
    expect(majorMinorVersion("26.8.1-beta.1")).toBe("26.8");
  });

  it("returns null for unparseable versions", () => {
    expect(majorMinorVersion("")).toBeNull();
    expect(majorMinorVersion("26")).toBeNull();
  });
});

describe("compareActualVersions", () => {
  it("marks matching major.minor as compatible", () => {
    expect(compareActualVersions("26.8.1", "26.8.0")).toEqual({
      apiMajorMinor: "26.8",
      serverMajorMinor: "26.8",
      compatible: true,
    });
  });

  it("flags skew across major.minor", () => {
    expect(compareActualVersions("26.8.1", "25.12.0")).toEqual({
      apiMajorMinor: "26.8",
      serverMajorMinor: "25.12",
      compatible: false,
    });
  });
});
