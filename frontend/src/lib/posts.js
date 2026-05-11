/**
 * Shared in-memory "API" for the MVP.
 *
 * Note: This is intentionally simple (module-level state). It will reset on
 * server restart / HMR and is not meant for production persistence.
 */
import { mockPosts as uiMockPosts } from "../data/mockPosts";

function isoNow() {
  return new Date().toISOString();
}

function clone(value) {
  // Avoid accidental cross-page mutations in callers.
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function seedFromUiMocks() {
  // Map existing UI-only mock posts into the shared MVP structure.
  return uiMockPosts.map((p, idx) => {
    const id = idx + 1;
    return {
      id,
      title: p.title,
      content: p.description,
      keywords: p.tags,
      author: {
        name: p.author.name,
        bio: "Researcher at OddAcademia (mock).",
        avatar: p.author.avatarUrl ?? "/avatars/profile.svg",
      },
      date: isoNow(),
      stats: {
        downloads: 120 + id * 7,
        rating: 4.2,
        shares: 12 + id,
        citations: 3 + id,
      },
      comments: [
        {
          id: id * 100 + 1,
          user: "OddAcademia",
          text: "Great read — thanks for sharing!",
          date: isoNow(),
        },
      ],
    };
  });
}

let posts = seedFromUiMocks();
let nextPostId = posts.reduce((m, p) => Math.max(m, p.id), 0) + 1;
let nextCommentId =
  posts.reduce(
    (m, p) => Math.max(m, ...p.comments.map((c) => c.id)),
    0,
  ) + 1;

/**
 * @returns {import("./posts").Post[]}
 */
export function getPosts() {
  // Newest-first (lexicographic ISO sort works).
  return clone([...posts].sort((a, b) => b.date.localeCompare(a.date)));
}

/**
 * @param {number|string} id
 * @returns {import("./posts").Post | null}
 */
export function getPostById(id) {
  const numericId = typeof id === "string" ? Number(id) : id;
  if (!Number.isFinite(numericId)) return null;
  const post = posts.find((p) => p.id === numericId) ?? null;
  return post ? clone(post) : null;
}

/**
 * @param {import("./posts").NewPost} post
 * @returns {import("./posts").Post}
 */
export function addPost(post) {
  const created = {
    id: nextPostId++,
    title: post.title,
    content: post.content,
    keywords: post.keywords ?? [],
    author: {
      name: post.author?.name ?? "User",
      bio: post.author?.bio ?? "",
      avatar: post.author?.avatar ?? "/avatars/profile.svg",
    },
    date: post.date ?? isoNow(),
    stats: {
      downloads: post.stats?.downloads ?? 0,
      rating: post.stats?.rating ?? 0,
      shares: post.stats?.shares ?? 0,
      citations: post.stats?.citations ?? 0,
    },
    comments: [],
  };

  posts = [created, ...posts];
  return clone(created);
}

/**
 * @param {number|string} postId
 * @param {import("./posts").NewComment} comment
 * @returns {import("./posts").Comment}
 */
export function addComment(postId, comment) {
  const numericId = typeof postId === "string" ? Number(postId) : postId;
  if (!Number.isFinite(numericId)) {
    throw new Error("Invalid postId");
  }

  const idx = posts.findIndex((p) => p.id === numericId);
  if (idx === -1) {
    throw new Error("Post not found");
  }

  const created = {
    id: nextCommentId++,
    user: comment.user ?? "User",
    text: comment.text,
    date: comment.date ?? isoNow(),
  };

  const target = posts[idx];
  const updated = { ...target, comments: [...target.comments, created] };
  posts = posts.map((p, i) => (i === idx ? updated : p));

  return clone(created);
}

