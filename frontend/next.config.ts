import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    // Point to the monorepo root so Turbopack can resolve hoisted packages
    // (e.g. next, react) from the root node_modules.
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
