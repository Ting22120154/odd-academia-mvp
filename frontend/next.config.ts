import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point to the monorepo root so Turbopack can resolve hoisted packages
    // (e.g. next, react) from the root node_modules.
    root: path.resolve(__dirname, ".."),
  },
  // proxy.ts buffers POST bodies; default 10MB truncates PDF uploads (+ multipart overhead).
  experimental: {
    proxyClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
