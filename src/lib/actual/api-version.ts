import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

let cachedApiVersion: string | undefined;

export function getActualApiVersion(): string {
  if (cachedApiVersion) {
    return cachedApiVersion;
  }

  try {
    const require = createRequire(join(process.cwd(), "package.json"));
    const entryPath = require.resolve("@actual-app/api");
    const pkgPath = join(dirname(entryPath), "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      version: string;
    };
    cachedApiVersion = pkg.version;
  } catch {
    const appPkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf-8")
    ) as { dependencies?: Record<string, string> };
    const declared = appPkg.dependencies?.["@actual-app/api"] ?? "unknown";
    cachedApiVersion = declared.replace(/^\^/, "");
  }

  return cachedApiVersion;
}
