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
      categories: [p.category],
      publishedDate: isoNow().slice(0, 10),
      doi: "",
      references: [],
      contributors: [],
      attachment: undefined,
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

const STORE_KEY = "__oddAcademiaPostsStore";

function getStore() {
  const g = globalThis;
  if (!g[STORE_KEY]) {
    const seeded = seedFromUiMocks();
    g[STORE_KEY] = {
      posts: seeded,
      nextPostId: seeded.reduce((m, p) => Math.max(m, p.id), 0) + 1,
      nextCommentId:
        seeded.reduce(
          (m, p) => Math.max(m, ...p.comments.map((c) => c.id)),
          0,
        ) + 1,
    };
  }
  return g[STORE_KEY];
}

/**
 * @returns {import("./posts").Post[]}
 */
export function getPosts() {
  const store = getStore();
  // Newest-first (lexicographic ISO sort works).
  return clone([...store.posts].sort((a, b) => b.date.localeCompare(a.date)));
}

/**
 * @param {number|string} id
 * @returns {import("./posts").Post | null}
 */
export function getPostById(id) {
  const store = getStore();
  const numericId = typeof id === "string" ? Number(id) : id;
  if (!Number.isFinite(numericId)) return null;
  const post = store.posts.find((p) => p.id === numericId) ?? null;
  return post ? clone(post) : null;
}

/**
 * @param {import("./posts").NewPost} post
 * @returns {import("./posts").Post}
 */
export function addPost(post) {
  const store = getStore();
  const created = {
    id: store.nextPostId++,
    title: post.title,
    content: post.content,
    keywords: post.keywords ?? [],
    categories: post.categories ?? post.keywords ?? [],
    publishedDate: post.publishedDate ?? isoNow().slice(0, 10),
    doi: post.doi ?? "",
    references: post.references ?? [],
    contributors: post.contributors ?? [],
    attachment: post.attachment,
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

  store.posts = [created, ...store.posts];
  return clone(created);
}

/**
 * @param {number|string} id
 * @param {Partial<import("./posts").NewPost>} patch
 * @returns {import("./posts").Post}
 */
export function updatePost(id, patch) {
  const store = getStore();
  const numericId = typeof id === "string" ? Number(id) : id;
  if (!Number.isFinite(numericId)) {
    throw new Error("Invalid postId");
  }

  const idx = store.posts.findIndex((p) => p.id === numericId);
  if (idx === -1) {
    throw new Error("Post not found");
  }

  const existing = store.posts[idx];

  const updated = {
    ...existing,
    title: typeof patch.title === "string" ? patch.title : existing.title,
    content: typeof patch.content === "string" ? patch.content : existing.content,
    keywords: Array.isArray(patch.keywords) ? patch.keywords : existing.keywords,
    categories: Array.isArray(patch.categories) ? patch.categories : existing.categories,
    // Treat edits as "recent activity" so feeds update predictably.
    date: isoNow(),
    publishedDate:
      typeof patch.publishedDate === "string" ? patch.publishedDate : existing.publishedDate,
    doi: typeof patch.doi === "string" ? patch.doi : existing.doi,
    references: Array.isArray(patch.references) ? patch.references : existing.references,
    contributors: Array.isArray(patch.contributors) ? patch.contributors : existing.contributors,
    attachment: patch.attachment ?? existing.attachment,
    author: patch.author
      ? {
          name: patch.author.name ?? existing.author.name,
          bio: patch.author.bio ?? existing.author.bio,
          avatar: patch.author.avatar ?? existing.author.avatar,
        }
      : existing.author,
  };

  store.posts = store.posts.map((p, i) => (i === idx ? updated : p));
  return clone(updated);
}

/**
 * @param {number|string} postId
 * @param {import("./posts").NewComment} comment
 * @returns {import("./posts").Comment}
 */
export function addComment(postId, comment) {
  const store = getStore();
  const numericId = typeof postId === "string" ? Number(postId) : postId;
  if (!Number.isFinite(numericId)) {
    throw new Error("Invalid postId");
  }

  const idx = store.posts.findIndex((p) => p.id === numericId);
  if (idx === -1) {
    throw new Error("Post not found");
  }

  const created = {
    id: store.nextCommentId++,
    user: comment.user ?? "User",
    text: comment.text,
    date: comment.date ?? isoNow(),
  };

  const target = store.posts[idx];
  const updated = { ...target, comments: [...target.comments, created] };
  store.posts = store.posts.map((p, i) => (i === idx ? updated : p));

  return clone(created);
}

