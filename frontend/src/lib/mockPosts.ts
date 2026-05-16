// Re-exported from the shared data package — single source of truth.
// To update post data, edit packages/db/src/data.ts (papers array).
export type { FrontendViewerPost as MockPost } from "@odd-academia/db";
export { mockFrontendViewerPosts as mockPosts } from "@odd-academia/db";

import { mockFrontendViewerPosts } from "@odd-academia/db";

export function getMockPostById(id: string) {
  return mockFrontendViewerPosts.find(p => p.id === id) ?? null;
}
