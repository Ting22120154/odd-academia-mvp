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
export const mockPosts: MockPost[] = [
  {
    id: "1",
    title: "Example Research Post 1",
    summary: "Short summary of the research post.",
    authorName: "Student A",
    subject: "AI",
  },
  {
    id: "2",
    title: "Example Research Post 2",
    summary: "Another short summary.",
    authorName: "Student B",
    subject: "Health",
  },
];

export function getMockPostById(id: string) {
  return mockPosts.find((p) => p.id === id) ?? null;
}

