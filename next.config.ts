import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@actual-app/api", "better-sqlite3"],
  output: "standalone",
};

export default nextConfig;
