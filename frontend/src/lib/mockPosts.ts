import { mockPosts as uiMockPosts } from "@/data/mockPosts";

export type MockPost = {
  id: string;
  title: string;
  summary: string;
  authorName: string;
  subject: string;
};

/**
 * Temporary in-memory data used to unblock UI/routing work before the backend exists.
 *
 * Replace plan:
 * - Swap `mockPosts` + `getMockPostById` with API calls (e.g. `/api/posts` and `/api/posts/:id`)
 * - Keep the `MockPost` shape as a starting point for a shared Post type.
 */
export const mockPosts: MockPost[] = uiMockPosts.map((p) => ({
  id: p.id,
  title: p.title,
  summary: p.description,
  authorName: p.author.name,
  subject: p.category,
}));

export function getMockPostById(id: string) {
  return mockPosts.find((p) => p.id === id) ?? null;
}

