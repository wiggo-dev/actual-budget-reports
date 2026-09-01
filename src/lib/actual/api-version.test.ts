import { describe, expect, it } from "vitest";

import { getActualApiVersion } from "@/lib/actual/api-version";

describe("getActualApiVersion", () => {
  it("reads the installed @actual-app/api version", () => {
    expect(getActualApiVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
