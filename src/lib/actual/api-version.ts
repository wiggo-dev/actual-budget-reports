import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

let cachedApiVersion: string | undefined;

const require = createRequire(import.meta.url);

export function getActualApiVersion(): string {
  if (cachedApiVersion) {
    return cachedApiVersion;
  }

  const entryPath = require.resolve("@actual-app/api");
  const pkgPath = join(dirname(entryPath), "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
  cachedApiVersion = pkg.version;
  return cachedApiVersion;
}
