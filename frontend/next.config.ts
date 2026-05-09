import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fix: C:\Users\prem\package.json is detected as the workspace root, causing
    // Turbopack to look for node_modules in the wrong directory. Pinning root to
    // this file's directory forces it to resolve packages from frontend/.
    root: __dirname,
  },
};

export default nextConfig;
