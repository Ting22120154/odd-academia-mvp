// Re-exported from the shared data package — single source of truth.
// To update post data, edit packages/db/src/data.ts (papers array).
export type { FrontendPost as MockPost } from "@odd-academia/db";
export { mockFrontendPosts as mockPosts } from "@odd-academia/db";

// PostCategory and CATEGORIES are UI-specific navigation config, not entity data.
export type PostCategory =
  | "Trending"
  | "Biohacking"
  | "Maths"
  | "Sustainability"
  | "Technology"
  | "AI"
  | "Business";

export const CATEGORIES: PostCategory[] = [
  "Trending",
  "Biohacking",
  "Maths",
  "Sustainability",
  "Technology",
  "AI",
  "Business",
];
