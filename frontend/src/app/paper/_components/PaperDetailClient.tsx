"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MockPost } from "@/lib/mockPosts";
import { GuestTracker } from "@/app/paper/_components/GuestTracker";
import { mockPosts } from "@/lib/mockPosts";
import { mockUser } from "@/data/mockUser";
import { useAuth } from "@/context/AuthContext";
import {
  createComment as createCommentApi,
  deleteComment as deleteCommentApi,
  fetchCommentsForPaper,
  likeComment as likeCommentApi,
  unlikeComment as unlikeCommentApi,
  updateComment as updateCommentApi,
} from "@/lib/comments-client";
import type { CommentResponse } from "@/modules/comments/types";

type Props = {
  post: MockPost;
  /** Neon `papers.id` for comments API (mock route ids like `1` resolved on server). */
  commentsPaperId: string | null;
};

type UiReply = {
  id: string;
  authorId: string;
  name: string;
  time: string;
  text: string;
  likes: number;
  likedByMe: boolean;
};

type UiComment = {
  id: string;
  authorId: string;
  name: string;
  time: string;
  text: string;
  likes: number;
  likedByMe: boolean;
  replies: UiReply[];
};

function getDbUserIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "auth-user-id") {
      return decodeURIComponent(rest.join("=")) || null;
    }
  }
  return null;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr. ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function mapComment(c: CommentResponse): UiComment {
  return {
    id: c.id,
    authorId: c.user.id,
    name: c.user.fullName,
    time: formatRelativeTime(c.createdAt),
    text: c.content,
    likes: c.likesCount,
    likedByMe: c.likedByMe ?? false,
    replies: c.replies.map((r) => ({
      id: r.id,
      authorId: r.user.id,
      name: r.user.fullName,
      time: formatRelativeTime(r.createdAt),
      text: r.content,
      likes: r.likesCount,
      likedByMe: r.likedByMe ?? false,
    })),
  };
}

function CommentLikeButton({
  count,
  liked,
  disabled,
  onClick,
}: {
  count: number;
  liked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center gap-1.5",
        liked ? "font-medium text-[var(--brand)] hover:opacity-80" : "hover:text-zinc-600",
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Login to like comments" : liked ? "Unlike" : "Like"}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>Like</span>
      <span className="tabular-nums text-zinc-500">{count}</span>
    </button>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function ToolPill({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
    >
      <span className="text-zinc-400">●</span>
      <span>{children}</span>
    </button>
  );
}

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600">
      <span className="text-zinc-400" aria-hidden>
        {icon}
      </span>
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white hover:opacity-95",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function OutlineButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function PaperDetailClient({ post, commentsPaperId }: Props) {
  const { isLoggedIn } = useAuth();

  const [followPaper, setFollowPaper] = useState(false);
  const [followAuthor, setFollowAuthor] = useState(false);
  const [comments, setComments] = useState<UiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    if (isLoggedIn) setDbUserId(getDbUserIdFromCookie());
    else setDbUserId(null);
  }, [isLoggedIn]);

  const loadComments = useCallback(async () => {
    if (!commentsPaperId) {
      setComments([]);
      return;
    }
    setCommentsLoading(true);
    setCommentsError(null);
    if (isLoggedIn) setDbUserId(getDbUserIdFromCookie());
    try {
      const rows = await fetchCommentsForPaper(commentsPaperId);
      setComments(rows.map(mapComment));
    } catch {
      setCommentsError("Could not load comments.");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [commentsPaperId, isLoggedIn]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (commentsLoading || comments.length === 0) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash.startsWith("#comment-")) return;

    const targetId = hash.slice(1);
    const scrollToComment = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[var(--brand)]", "ring-offset-2", "rounded-xl");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-[var(--brand)]", "ring-offset-2", "rounded-xl");
        }, 2500);
      }
    };

    scrollToComment();
    const retry = window.setTimeout(scrollToComment, 400);
    return () => window.clearTimeout(retry);
  }, [commentsLoading, comments]);

  const related = useMemo(() => {
    // Related papers are mocked by "same subject OR shared tag", excluding current post.
    return mockPosts
      .filter((p) => p.id !== post.id)
      .filter((p) => p.subject === post.subject || (p.tags ?? []).some((t) => (post.tags ?? []).includes(t)))
      .slice(0, 3);
  }, [post.id, post.subject, post.tags]);

  async function submitTopLevelComment() {
    const trimmed = composer.trim();
    if (!trimmed || actionLoading) return;
    if (!isLoggedIn) {
      setCommentsError("Login to post a comment.");
      return;
    }
    if (!commentsPaperId) {
      setCommentsError("Comments are not available for this paper yet.");
      return;
    }

    setActionLoading(true);
    setCommentsError(null);
    const result = await createCommentApi(commentsPaperId, trimmed);
    setActionLoading(false);

    if (!result.ok) {
      setCommentsError(result.error);
      return;
    }

    setComposer("");
    await loadComments();
  }

  async function submitReply(commentId: string) {
    const trimmed = replyDraft.trim();
    if (!trimmed || actionLoading) return;
    if (!commentsPaperId) {
      setCommentsError("Comments are not available for this paper yet.");
      return;
    }

    setActionLoading(true);
    setCommentsError(null);
    const result = await createCommentApi(commentsPaperId, trimmed, {
      parentCommentId: commentId,
    });
    setActionLoading(false);

    if (!result.ok) {
      setCommentsError(result.error);
      return;
    }

    setReplyDraft("");
    setActiveReplyFor(null);
    await loadComments();
  }

  function isOwnComment(authorId: string) {
    return Boolean(dbUserId && authorId === dbUserId);
  }

  function startEdit(commentId: string, currentText: string) {
    setEditingCommentId(commentId);
    setEditDraft(currentText);
    setActiveReplyFor(null);
  }

  function cancelEdit() {
    setEditingCommentId(null);
    setEditDraft("");
  }

  async function saveEdit(commentId: string) {
    const trimmed = editDraft.trim();
    if (!trimmed || actionLoading) return;
    setActionLoading(true);
    setCommentsError(null);
    const result = await updateCommentApi(commentId, trimmed);
    setActionLoading(false);
    if (!result.ok) {
      setCommentsError(result.error);
      return;
    }
    cancelEdit();
    await loadComments();
  }

  async function removeComment(commentId: string) {
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    setActionLoading(true);
    setCommentsError(null);
    const result = await deleteCommentApi(commentId);
    setActionLoading(false);
    if (!result.ok) {
      setCommentsError(result.error);
      return;
    }
    if (editingCommentId === commentId) cancelEdit();
    await loadComments();
  }

  async function toggleCommentLike(commentId: string) {
    if (!isLoggedIn) {
      setCommentsError("Login to like comments.");
      return;
    }

    let currentlyLiked = false;
    for (const c of comments) {
      if (c.id === commentId) {
        currentlyLiked = c.likedByMe;
        break;
      }
      const reply = c.replies.find((r) => r.id === commentId);
      if (reply) {
        currentlyLiked = reply.likedByMe;
        break;
      }
    }

    setActionLoading(true);
    setCommentsError(null);
    const result = currentlyLiked
      ? await unlikeCommentApi(commentId)
      : await likeCommentApi(commentId);
    setActionLoading(false);

    if (!result.ok) {
      setCommentsError(result.error);
      return;
    }

    await loadComments();
  }

  return (
    <div className="space-y-6">
      {/* Tracks guest article views and enforces the 5-article limit */}
      <GuestTracker paperId={post.id} />
      {/* This page uses the global top nav from RootLayout (Figma style). */}

      {/* Two-column layout matches the Figma viewer page */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left column */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-200" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{post.authorName}</div>
                <div className="text-xs text-zinc-400">PhD</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{mockUser.bio}</p>
            <Link href="#" className="text-sm font-semibold text-[var(--brand)] hover:underline">
              Read More…
            </Link>

            <div className="mt-4">
              {isLoggedIn ? (
                <PrimaryButton
                  className="w-full"
                  onClick={() => setFollowAuthor((v) => !v)}
                  aria-pressed={followAuthor}
                >
                  {followAuthor ? "Following" : "Follow"}
                </PrimaryButton>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-medium text-white hover:opacity-95"
                >
                  Login to Follow
                </Link>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-sm font-semibold text-zinc-900">Related Papers</div>
            <ul className="space-y-3">
              {related.map((p) => (
                <li key={p.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
                  <Link href={`/paper/${p.id}`} className="block">
                    <div className="h-24 bg-zinc-200" />
                    <div className="p-4">
                      <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* Right column */}
        <div className="space-y-4">
          {/* Title + meta */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <Link href="/" className="hover:text-zinc-700">
                ← Back
              </Link>
            </div>
            <div className="text-2xl font-semibold leading-tight tracking-tight text-zinc-900 lg:text-[28px]">
              {post.title}
            </div>
            <div className="text-sm text-zinc-500">{post.summary}</div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Authored by <span className="font-semibold text-zinc-700">{post.authorName}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip icon="📅">10-11-2024</Chip>
              <Chip icon="🏷️">{post.subject}</Chip>
              <Chip icon="＋">{(post.tags ?? [])[0] ?? "AI infrastructure"}</Chip>
            </div>

            {/* Follow row (login-gated). Use Follow Paper instead of save/bookmark. */}
            {isLoggedIn ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PrimaryButton
                  onClick={() => setFollowPaper((v) => !v)}
                  aria-pressed={followPaper}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    ⤴ {followPaper ? "Following Paper" : "Follow Paper"}
                  </span>
                  <span className="text-white/90">35</span>
                </PrimaryButton>
                <PrimaryButton
                  onClick={() => setFollowAuthor((v) => !v)}
                  aria-pressed={followAuthor}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    👤 {followAuthor ? "Following Author" : "Follow Author"}
                  </span>
                  <span className="text-white/90">35</span>
                </PrimaryButton>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--brand)] text-sm font-medium text-[var(--brand)] hover:bg-[rgba(0,102,255,0.04)]"
              >
                Login to follow and comment
              </Link>
            )}
          </section>

          {/* Reader */}
          <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center gap-1 border-b border-black/[0.06] bg-white px-3 py-2">
              <ToolPill>Page 1 of 235</ToolPill>
              <ToolPill>Zoom</ToolPill>
              <ToolPill>Full-screen</ToolPill>
              {/* Dark mode is intentionally not present here (toggled from Profile Settings only). */}
            </div>

            <div className="bg-zinc-50 px-8 py-10">
              <div className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900">
                {post.title}
              </div>
              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600">
                {post.summary}
              </p>

              {post.fileType === "pdf" && post.fileUrl ? (
                <div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
                  <iframe
                    title="PDF reader"
                    src={post.fileUrl}
                    className="h-[70vh] w-full bg-white"
                  />
                </div>
              ) : null}
            </div>
          </section>

          {/* Abstract + references */}
          <section className="space-y-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-zinc-900">Abstract</div>
              <p className="text-sm leading-7 text-zinc-600">
                This research paper explores {post.title}. For this MVP, the abstract is mocked and can be
                replaced with backend content later.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-zinc-900">References</div>
              <ul className="space-y-2 text-sm">
                {[
                  "Patel, R., et al. (2022). Energy storage innovations for urban resilience. Urban Landscape Transformations.",
                  "Lee, A., & Johnson, M. (2022). Sustainable infrastructure in megacities: Challenges and opportunities. Urban Landscape Transformations.",
                  "Nguyen, T., & Carter, J. (2022). Green spaces and their impact on urban energy efficiency. Urban Landscape Transformations.",
                  "O'Neill, D., et al. (2022). Adaptive reuse of existing buildings in the urban environment. Urban Landscape Transformations.",
                ].map((r) => (
                  <li key={r} className="rounded-xl bg-zinc-50 px-4 py-3">
                    <a href="#" className="text-[var(--brand)] underline-offset-2 hover:underline">
                      {r}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comments composer is login-gated (per Figma). */}
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="inline-flex h-10 w-fit items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-medium text-white hover:opacity-95"
              >
                Login to Comment
              </Link>
            ) : (
              <div className="space-y-3 rounded-2xl border border-black/[0.06] p-4">
                <div className="text-xs font-medium text-zinc-500">Comment</div>
                <textarea
                  value={composer}
                  onChange={(e) => setComposer(e.target.value.slice(0, 200))}
                  placeholder="Write a comment…"
                  className="mt-2 min-h-[120px] w-full resize-none rounded-xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:border-black/20"
                />
                <div className="flex items-center justify-between gap-3">
                  <PrimaryButton onClick={() => void submitTopLevelComment()} disabled={actionLoading}>
                    {actionLoading ? "Posting…" : "Post Comment"}
                  </PrimaryButton>
                  <span className="text-[11px] text-zinc-400">{composer.length}/200</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-lg font-semibold text-zinc-900">Comments</div>

              {!commentsPaperId ? (
                <p className="text-sm text-zinc-500">
                  Comments are unavailable for this paper until it is linked to the database.
                </p>
              ) : null}

              {commentsError ? (
                <p className="text-sm text-red-600" role="alert">
                  {commentsError}
                </p>
              ) : null}

              {commentsLoading ? (
                <p className="text-sm text-zinc-500">Loading comments…</p>
              ) : null}

              {!commentsLoading && commentsPaperId && comments.length === 0 ? (
                <p className="text-sm text-zinc-500">No comments yet.</p>
              ) : null}

              <ul className="space-y-6">
                {comments.map((c) => (
                  <li key={c.id} id={`comment-${c.id}`} className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <div className="text-sm font-semibold text-zinc-900">{c.name}</div>
                          <div className="text-xs text-zinc-400">{c.time}</div>
                        </div>
                        {editingCommentId === c.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              className="min-h-[80px] w-full resize-none rounded-xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:border-black/20"
                            />
                            <div className="flex gap-2">
                              <PrimaryButton
                                onClick={() => void saveEdit(c.id)}
                                disabled={actionLoading || !editDraft.trim()}
                              >
                                Save
                              </PrimaryButton>
                              <OutlineButton onClick={cancelEdit} disabled={actionLoading}>
                                Cancel
                              </OutlineButton>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-7 text-zinc-700">{c.text}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                          <CommentLikeButton
                            count={c.likes}
                            liked={c.likedByMe}
                            disabled={!isLoggedIn}
                            onClick={() => void toggleCommentLike(c.id)}
                          />

                          <button
                            type="button"
                            className="hover:text-zinc-600"
                            onClick={() => {
                              if (!isLoggedIn) return;
                              setActiveReplyFor((prev) => (prev === c.id ? null : c.id));
                            }}
                          >
                            {c.replies.length > 0 ? `${c.replies.length} Reply` : "Reply"}
                          </button>

                          {isOwnComment(c.authorId) && editingCommentId !== c.id ? (
                            <>
                              <button
                                type="button"
                                className="hover:text-zinc-600"
                                onClick={() => startEdit(c.id, c.text)}
                                disabled={actionLoading}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="hover:text-red-600"
                                onClick={() => void removeComment(c.id)}
                                disabled={actionLoading}
                              >
                                Delete
                              </button>
                            </>
                          ) : null}
                        </div>

                        {activeReplyFor === c.id && isLoggedIn ? (
                          <div className="mt-4 flex gap-2">
                            <input
                              value={replyDraft}
                              onChange={(e) => setReplyDraft(e.target.value)}
                              placeholder="Write a reply…"
                              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm outline-none focus:border-black/20"
                            />
                            <PrimaryButton
                              onClick={() => void submitReply(c.id)}
                              disabled={actionLoading}
                            >
                              Reply
                            </PrimaryButton>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {c.replies.length > 0 ? (
                      <ul className="ml-12 space-y-4 border-l border-black/[0.06] pl-6">
                        {c.replies.map((r) => (
                          <li key={r.id} id={`comment-${r.id}`} className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                              {initials(r.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <div className="text-sm font-semibold text-zinc-900">{r.name}</div>
                                <div className="text-xs text-zinc-400">{r.time}</div>
                              </div>
                              {editingCommentId === r.id ? (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    value={editDraft}
                                    onChange={(e) => setEditDraft(e.target.value)}
                                    className="min-h-[64px] w-full resize-none rounded-xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:border-black/20"
                                  />
                                  <div className="flex gap-2">
                                    <PrimaryButton
                                      onClick={() => void saveEdit(r.id)}
                                      disabled={actionLoading || !editDraft.trim()}
                                    >
                                      Save
                                    </PrimaryButton>
                                    <OutlineButton onClick={cancelEdit} disabled={actionLoading}>
                                      Cancel
                                    </OutlineButton>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm leading-7 text-zinc-700">{r.text}</p>
                              )}

                              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                                <CommentLikeButton
                                  count={r.likes}
                                  liked={r.likedByMe}
                                  disabled={!isLoggedIn}
                                  onClick={() => void toggleCommentLike(r.id)}
                                />

                                {isOwnComment(r.authorId) && editingCommentId !== r.id ? (
                                  <>
                                    <button
                                      type="button"
                                      className="hover:text-zinc-600"
                                      onClick={() => startEdit(r.id, r.text)}
                                      disabled={actionLoading}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="hover:text-red-600"
                                      onClick={() => void removeComment(r.id)}
                                      disabled={actionLoading}
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

