export type ActualServerVersionResult =
  { version: string } | { error: "network-failure" };

/** Actual recommends matching major.minor between API client and sync server. */
export function majorMinorVersion(version: string): string | null {
  const parts = version.trim().split(".");
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return `${parts[0]}.${parts[1]}`;
}

export function compareActualVersions(
  apiVersion: string,
  serverVersion: string
): {
  compatible: boolean;
  apiMajorMinor: string;
  serverMajorMinor: string;
} | null {
  const apiMajorMinor = majorMinorVersion(apiVersion);
  const serverMajorMinor = majorMinorVersion(serverVersion);

  if (!apiMajorMinor || !serverMajorMinor) {
    return null;
  }

  return {
    apiMajorMinor,
    serverMajorMinor,
    compatible: apiMajorMinor === serverMajorMinor,
  };
}

export async function fetchActualServerVersion(
  serverURL: string,
  timeoutMs = 5000
): Promise<ActualServerVersionResult> {
  try {
    const url = new URL("/info", serverURL);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return { error: "network-failure" };
    }

    const info = (await response.json()) as {
      build?: { version?: string };
    };
    const version = info.build?.version;

    if (!version) {
      return { error: "network-failure" };
    }

    return { version };
  } catch {
    return { error: "network-failure" };
  }
}
