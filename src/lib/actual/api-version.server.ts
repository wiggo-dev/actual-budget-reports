import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

let cachedApiVersion: string | undefined;

export function getActualApiVersion(): string {
  if (cachedApiVersion) {
    return cachedApiVersion;
  }

  const pkgPath = join(
    process.cwd(),
    "node_modules",
    "@actual-app/api",
    "package.json"
  );
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
  cachedApiVersion = pkg.version;
  return cachedApiVersion;
}
