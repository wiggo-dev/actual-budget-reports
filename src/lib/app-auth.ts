import { timingSafeEqual } from "node:crypto";

export type AppAuthConfig = {
  user: string;
  password: string;
};

type EnvBag = Record<string, string | undefined>;

const DEFAULT_USER = "reports";
const REALM = "Actual Budget Reports";

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Returns null when auth is disabled (password unset). */
export function getAppAuthConfig(
  env: EnvBag = process.env
): AppAuthConfig | null {
  const password = emptyToUndefined(env.APP_AUTH_PASSWORD);
  if (!password) {
    return null;
  }

  return {
    user: emptyToUndefined(env.APP_AUTH_USER) ?? DEFAULT_USER,
    password,
  };
}

export function isAppAuthEnabled(env: EnvBag = process.env): boolean {
  return getAppAuthConfig(env) != null;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function decodeBasicCredentials(
  authorization: string
): { user: string; password: string } | null {
  const match = /^Basic\s+(\S+)$/i.exec(authorization);
  if (!match) {
    return null;
  }

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) {
      return null;
    }

    return {
      user: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function decodeBearerToken(authorization: string): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  return match?.[1] ?? null;
}

/**
 * When auth is disabled, always true.
 * When enabled, accepts Basic (user + password) or Bearer (password as token).
 */
export function isAuthorized(
  authorizationHeader: string | null | undefined,
  env: EnvBag = process.env
): boolean {
  const config = getAppAuthConfig(env);
  if (!config) {
    return true;
  }

  if (!authorizationHeader) {
    return false;
  }

  const basic = decodeBasicCredentials(authorizationHeader);
  if (basic) {
    return (
      safeEqual(basic.user, config.user) &&
      safeEqual(basic.password, config.password)
    );
  }

  const bearer = decodeBearerToken(authorizationHeader);
  if (bearer) {
    return safeEqual(bearer, config.password);
  }

  return false;
}

export function unauthorizedResponse(): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}"`,
      "Cache-Control": "no-store",
    },
  });
}
