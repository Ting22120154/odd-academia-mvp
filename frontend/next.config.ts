import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages resolve via pnpm in frontend/node_modules; avoid setting
  // turbopack.root to the monorepo parent — it widens file watching and breaks
  // App Router route discovery in dev (EMFILE / 404 on every page).
  transpilePackages: ["@odd-academia/db"],
  // proxy.ts buffers POST bodies; default 10MB truncates PDF uploads (+ multipart overhead).
  experimental: {
    proxyClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
