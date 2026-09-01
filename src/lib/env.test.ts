import { afterEach, describe, expect, it } from "vitest";

import { getEnv, isActualConfigured } from "@/lib/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getEnv", () => {
  it("treats empty strings as unset optional values", () => {
    process.env = {
      ...originalEnv,
      ACTUAL_SERVER_URL: "",
      ACTUAL_SERVER_PASSWORD: "",
      ACTUAL_SYNC_ID: "",
      ACTUAL_E2E_PASSWORD: "",
    };

    const env = getEnv();

    expect(env.ACTUAL_SERVER_URL).toBeUndefined();
    expect(env.ACTUAL_SERVER_PASSWORD).toBeUndefined();
    expect(env.ACTUAL_SYNC_ID).toBeUndefined();
    expect(env.ACTUAL_E2E_PASSWORD).toBeUndefined();
    expect(isActualConfigured()).toBe(false);
  });
});
