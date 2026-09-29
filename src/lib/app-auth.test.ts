import { describe, expect, it } from "vitest";

import {
  getAppAuthConfig,
  isAppAuthEnabled,
  isAuthorized,
} from "@/lib/app-auth";

function basic(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

describe("getAppAuthConfig", () => {
  it("is disabled when password is unset or empty", () => {
    expect(getAppAuthConfig({})).toBeNull();
    expect(getAppAuthConfig({ APP_AUTH_PASSWORD: "" })).toBeNull();
    expect(getAppAuthConfig({ APP_AUTH_PASSWORD: "   " })).toBeNull();
    expect(isAppAuthEnabled({})).toBe(false);
  });

  it("defaults username to reports when password is set", () => {
    expect(getAppAuthConfig({ APP_AUTH_PASSWORD: "s3cret" })).toEqual({
      user: "reports",
      password: "s3cret",
    });
    expect(isAppAuthEnabled({ APP_AUTH_PASSWORD: "s3cret" })).toBe(true);
  });

  it("honours APP_AUTH_USER when provided", () => {
    expect(
      getAppAuthConfig({
        APP_AUTH_PASSWORD: "s3cret",
        APP_AUTH_USER: "homelab",
      })
    ).toEqual({
      user: "homelab",
      password: "s3cret",
    });
  });
});

describe("isAuthorized", () => {
  const env = { APP_AUTH_PASSWORD: "s3cret", APP_AUTH_USER: "reports" };

  it("allows all requests when auth is disabled", () => {
    expect(isAuthorized(null, {})).toBe(true);
    expect(isAuthorized(undefined, {})).toBe(true);
    expect(isAuthorized("Basic nope", {})).toBe(true);
  });

  it("rejects missing credentials when auth is enabled", () => {
    expect(isAuthorized(null, env)).toBe(false);
    expect(isAuthorized("", env)).toBe(false);
  });

  it("accepts matching Basic credentials", () => {
    expect(isAuthorized(basic("reports", "s3cret"), env)).toBe(true);
  });

  it("rejects wrong Basic user or password", () => {
    expect(isAuthorized(basic("wrong", "s3cret"), env)).toBe(false);
    expect(isAuthorized(basic("reports", "wrong"), env)).toBe(false);
  });

  it("accepts Bearer token matching the password", () => {
    expect(isAuthorized("Bearer s3cret", env)).toBe(true);
    expect(isAuthorized("Bearer wrong", env)).toBe(false);
  });
});
