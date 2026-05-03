import path from "path";
import type { NextConfig } from "next";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const tailwindPackageDir = path.join(configDir, "node_modules", "tailwindcss");

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir,
    resolveAlias: {
      tailwindcss: tailwindPackageDir,
    },
  },
};

export default nextConfig;
