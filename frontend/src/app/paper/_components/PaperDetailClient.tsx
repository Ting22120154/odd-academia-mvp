"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MockPost } from "@/lib/mockPosts";
import { EmbeddedPdfViewer } from "@/app/paper/_components/EmbeddedPdfViewer";
import { GuestTracker } from "@/app/paper/_components/GuestTracker";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { notifySavedPapersChanged } from "@/lib/saved-papers-events";
import {
  createComment as createCommentApi,
  deleteComment as deleteCommentApi,
  fetchCommentsForPaper,
  likeComment as likeCommentApi,
  unlikeComment as unlikeCommentApi,
  updateComment as updateCommentApi,
} from "@/lib/comments-client";
import {
  fetchPaperSaveStatus,
  savePaper as savePaperApi,
  unsavePaper as unsavePaperApi,
} from "@/lib/saved-papers-client";
import type { CommentResponse } from "@/modules/comments/types";
import { isValidUserId } from "@/lib/auth/user-id";
import { fetchFollowStatus, toggleFollow } from "@/lib/follow-client";
import {
  fetchPaperFollowStatus,
  togglePaperFollow,
} from "@/lib/paper-follow-client";
import { paperDownloadFilename } from "@/lib/files/paperFilename";
import {
  brandButtonHover,
  cardLinkHover,
  clickableHoverInset,
  linkHover,
  outlineButtonHover,
} from "@/lib/ui/interactive";

type Props = {
  post: MockPost;
  /** Neon `papers.id` for comments API (resolved on server). */
  commentsPaperId: string | null;
  relatedPosts?: MockPost[];
};

function pathExtFromUrl(fileUrl?: string): string {
  if (!fileUrl) return ".pdf";
  const match = fileUrl.match(/\.[a-z0-9]+$/i);
  return match?.[0]?.toLowerCase() ?? ".pdf";
}

function buildApaLikeCitation(post: MockPost) {
  // MVP: simple placeholder citation format (not a full APA generator).
  const year = new Date().getFullYear();
  return `${post.authorName} (${year}). ${post.title}. Odd Academia.`;
}

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
  const label = count > 0 ? `${count} Like${count === 1 ? "" : "s"}` : "Like";
  return (
    <button
      type="button"
      className={liked ? "font-medium text-[var(--brand)] hover:opacity-80" : "hover:text-zinc-600"}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Login to like comments" : liked ? "Unlike" : "Like"}
    >
      {label}
    </button>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function NonPdfDownloadButton({
  fileSrc,
  downloadFilename,
}: {
  fileSrc: string;
  downloadFilename: string;
}) {
  async function handleDownload() {
    const res = await fetch(`${fileSrc}?download=1`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFilename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      className={`mt-2 text-sm font-semibold text-[var(--brand)] ${linkHover}`}
    >
      Download {downloadFilename}
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
        `inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white ${brandButtonHover}`,
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
        `inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-medium text-zinc-700 ${outlineButtonHover}`,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

type ReportDraft = { subject: string; description: string };

function ReportModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: ReportDraft) => void;
}) {
  const [draft, setDraft] = useState<ReportDraft>({ subject: "", description: "" });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div id="report-title" className="text-base font-semibold text-zinc-900">
              Report comment
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              Help us understand what went wrong.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700" htmlFor="report-subject">
              Subject
            </label>
            <input
              id="report-subject"
              value={draft.subject}
              onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Short summary"
              className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-black/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700" htmlFor="report-description">
              Description
            </label>
            <textarea
              id="report-description"
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the issue"
              className="min-h-[110px] w-full resize-none rounded-xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:border-black/20"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <OutlineButton onClick={onClose} className="flex-1">
            Cancel
          </OutlineButton>
          <PrimaryButton
            onClick={() => onSubmit(draft)}
            className="flex-1"
            disabled={!draft.subject.trim() || !draft.description.trim()}
          >
            Submit
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function PaperDetailClient({ post, commentsPaperId, relatedPosts = [] }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const { isLoggedIn, user: sessionUser } = useAuth();
  const authorId = post.authorId;
  const canFollowAuthor = Boolean(
    authorId && isValidUserId(authorId) && sessionUser?.id !== authorId,
  );
  const citation = useMemo(() => buildApaLikeCitation(post), [post]);
  const sharePath = `/paper/${post.id}`;
  const fileApiSrc = `/api/papers/${post.id}/file`;
  const downloadFilename = useMemo(
    () => paperDownloadFilename(post.title, post.fileType === "pdf" ? ".pdf" : pathExtFromUrl(post.fileUrl)),
    [post.title, post.fileType, post.fileUrl],
  );
  const hasPdf = post.fileType === "pdf" && Boolean(post.fileUrl);

  const publishedLabel = useMemo(() => {
    if (!post.publishedAt) return "—";
    const d = new Date(post.publishedAt);
    // Avoid hydration mismatch from server/client locale differences.
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  }, [post.publishedAt]);

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
  }

  async function copyShareLink() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    await copyToClipboard(origin ? `${origin}${sharePath}` : sharePath);
  }

  const [followPaper, setFollowPaper] = useState(false);
  const [paperFollowerCount, setPaperFollowerCount] = useState(0);
  const [followPaperBusy, setFollowPaperBusy] = useState(false);
  const [followAuthor, setFollowAuthor] = useState(false);
  const [followAuthorBusy, setFollowAuthorBusy] = useState(false);
  const [paperSaved, setPaperSaved] = useState(false);
  const [saveStatusLoading, setSaveStatusLoading] = useState(false);
  const [saveActionLoading, setSaveActionLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [comments, setComments] = useState<UiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { isFollowing, followerCount } = await fetchPaperFollowStatus(post.id);
      if (cancelled) return;
      setFollowPaper(!!isFollowing);
      setPaperFollowerCount(followerCount);
    })();
    return () => { cancelled = true; };
  }, [post.id]);

  useEffect(() => {
    if (!isLoggedIn || !canFollowAuthor || !authorId) {
      setFollowAuthor(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { isFollowing } = await fetchFollowStatus(authorId);
      if (!cancelled) setFollowAuthor(!!isFollowing);
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, authorId, canFollowAuthor]);

  const handleFollowAuthor = useCallback(async () => {
    if (!authorId || !canFollowAuthor || followAuthorBusy) return;
    if (!isLoggedIn) { router.push("/login"); return; }
    setFollowAuthorBusy(true);
    const { isFollowing, error } = await toggleFollow(authorId, followAuthor);
    setFollowAuthorBusy(false);
    if (!error && typeof isFollowing === "boolean") setFollowAuthor(isFollowing);
  }, [authorId, canFollowAuthor, followAuthor, followAuthorBusy, isLoggedIn, router]);

  const followAuthorLabel = followAuthorBusy ? "…" : followAuthor ? "Unfollow" : "Follow Author";
  const followAuthorSidebarLabel = followAuthorBusy ? "…" : followAuthor ? "Unfollow" : "Follow";

  const handleFollowPaper = useCallback(async () => {
    if (followPaperBusy) return;
    if (!isLoggedIn) { router.push("/login"); return; }
    setFollowPaperBusy(true);
    const { isFollowing, followerCount, error } = await togglePaperFollow(post.id, followPaper);
    setFollowPaperBusy(false);
    if (!error) {
      if (typeof isFollowing === "boolean") setFollowPaper(isFollowing);
      if (typeof followerCount === "number") setPaperFollowerCount(followerCount);
    }
  }, [followPaper, followPaperBusy, isLoggedIn, post.id, router]);

  const followPaperLabel = followPaperBusy ? "…" : followPaper ? "Unfollow Paper" : "Follow Paper";

  const [composer, setComposer] = useState("");
  const [composerCitation, setComposerCitation] = useState("");
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [contribTab, setContribTab] = useState<"all" | "cited">("all");
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

  const loadSaveStatus = useCallback(async () => {
    if (!commentsPaperId || !isLoggedIn) {
      setPaperSaved(false);
      return;
    }
    setSaveStatusLoading(true);
    setSaveError(null);
    const status = await fetchPaperSaveStatus(commentsPaperId);
    setSaveStatusLoading(false);
    if (status) setPaperSaved(status.saved);
  }, [commentsPaperId, isLoggedIn]);

  useEffect(() => {
    void loadSaveStatus();
  }, [loadSaveStatus]);

  async function toggleSavePaper() {
    if (!commentsPaperId) {
      const msg = "Save is not available for this paper yet.";
      setSaveError(msg);
      showToast(msg, "error");
      return;
    }
    if (!isLoggedIn) {
      const msg = "Login to save papers.";
      setSaveError(msg);
      showToast(msg, "error");
      return;
    }
    setSaveActionLoading(true);
    setSaveError(null);
    const result = paperSaved
      ? await unsavePaperApi(commentsPaperId)
      : await savePaperApi(commentsPaperId);
    setSaveActionLoading(false);
    if (!result.ok) {
      setSaveError(result.error);
      showToast(result.error, "error");
      return;
    }
    setPaperSaved(result.saved);
    setSaveError(null);
    notifySavedPapersChanged();
    showToast(
      result.saved ? "Paper saved to your library" : "Removed from saved papers",
      "success",
    );
  }

  const related = relatedPosts;

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
    const result = await createCommentApi(commentsPaperId, trimmed, {
      citation: composerCitation.trim() || undefined,
    });
    setActionLoading(false);

    if (!result.ok) {
      setCommentsError(result.error);
      return;
    }

    setComposer("");
    setComposerCitation("");
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
              </div>
            </div>
            {post.authorBio ? (
              <p className="mt-3 text-sm leading-6 text-zinc-500">{post.authorBio}</p>
            ) : null}
            <Link href="#" className={`text-sm font-semibold text-[var(--brand)] ${linkHover}`}>
              Read More…
            </Link>

            <div className="mt-4">
              {isLoggedIn && canFollowAuthor ? (
                <PrimaryButton
                  className="w-full"
                  onClick={() => void handleFollowAuthor()}
                  disabled={followAuthorBusy}
                  aria-pressed={followAuthor}
                >
                  {followAuthorSidebarLabel}
                </PrimaryButton>
              ) : !isLoggedIn ? (
                <Link
                  href="/login"
                  className={`inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-medium text-white ${brandButtonHover}`}
                >
                  Login to Follow
                </Link>
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-sm font-semibold text-zinc-900">Related Papers</div>
            <ul className="space-y-3">
              {related.map((p) => (
                <li key={p.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
                  <Link href={`/paper/${p.id}`} className={`block ${cardLinkHover}`}>
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
          {/* Title + meta — Figma: arrow + title once, subtitle, author, tags */}
          <section className="space-y-4">
            <div className="flex min-w-0 items-start gap-3">
              <Link
                href="/home"
                aria-label="Back to home"
                className={`mt-1.5 shrink-0 rounded-lg px-1 py-0.5 text-lg leading-none text-zinc-600 ${linkHover}`}
              >
                ←
              </Link>
              <div className="min-w-0 flex-1 space-y-2">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-zinc-900 lg:text-[32px]">
                  {post.title}
                </h1>
                {post.summary ? (
                  <p className="text-base leading-relaxed text-zinc-500">{post.summary}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.authorAvatarUrl ?? "/avatars/profile.svg"}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover bg-zinc-200"
              />
              <p className="text-sm text-zinc-600">
                Authored by{" "}
                <span className="font-semibold text-zinc-900">{post.authorName}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip icon="📅">{publishedLabel}</Chip>
              <Chip icon="✦">{(post.tags ?? [])[0] ?? post.subject ?? "AI infrastructure"}</Chip>
            </div>

            {/* Follow + save row (login-gated). */}
            {isLoggedIn ? (
              <div className="space-y-2">
                {paperSaved ? (
                  <div className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-700 cursor-default select-none">
                    ✓ Paper Saved
                  </div>
                ) : (
                  <PrimaryButton
                    onClick={() => void toggleSavePaper()}
                    disabled={!commentsPaperId || saveStatusLoading || saveActionLoading}
                    className="w-full justify-center"
                  >
                    {saveActionLoading ? "Saving…" : saveStatusLoading ? "Loading…" : "☆ Save Paper"}
                  </PrimaryButton>
                )}
                {saveError ? (
                  <p className="text-xs text-red-600">{saveError}</p>
                ) : null}
                <PrimaryButton
                  onClick={() => void handleFollowPaper()}
                  disabled={followPaperBusy}
                  aria-pressed={followPaper}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">⤴ {followPaperLabel}</span>
                  <span className="text-white/90">{paperFollowerCount}</span>
                </PrimaryButton>
                {canFollowAuthor ? (
                  <PrimaryButton
                    onClick={() => void handleFollowAuthor()}
                    disabled={followAuthorBusy}
                    aria-pressed={followAuthor}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">👤 {followAuthorLabel}</span>
                  </PrimaryButton>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--brand)] text-sm font-medium text-[var(--brand)] hover:bg-[rgba(0,102,255,0.04)]"
              >
                Login to save this paper
              </Link>
            )}
          </section>

          {/* Reader — embedded PDF (no browser native viewer) */}
          {hasPdf ? (
            <EmbeddedPdfViewer
              fileSrc={fileApiSrc}
              downloadFilename={downloadFilename}
              downloadCount={post.viewCount ?? 0}
              shareCount={0}
              citationCount={post.citationCount ?? 0}
              onShare={() => void copyShareLink()}
              onCite={() => void copyToClipboard(citation)}
            />
          ) : post.fileUrl ? (
            <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 text-center shadow-[var(--shadow-sm)]">
              <p className="text-sm text-zinc-600">This paper is not a PDF preview.</p>
              <NonPdfDownloadButton
                fileSrc={fileApiSrc}
                downloadFilename={downloadFilename}
              />
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-dashed border-black/[0.12] bg-white p-8 text-center text-sm text-zinc-500 shadow-[var(--shadow-sm)]">
              No document has been uploaded for this paper yet.
            </section>
          )}

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
                    <a href="#" className={`text-[var(--brand)] underline-offset-2 ${linkHover}`}>
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
                className={`inline-flex h-10 w-fit items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-medium text-white ${brandButtonHover}`}
              >
                Login to Comment
              </Link>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-black/[0.06] p-4">
                  <div className="text-xs text-zinc-500">Comment</div>
                  <textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value.slice(0, 200))}
                    placeholder="Comment"
                    className="mt-2 min-h-[120px] w-full resize-none rounded-xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:border-black/20"
                  />
                  <div className="text-right text-[11px] text-zinc-400">{composer.length}/200</div>
                </div>

                <input
                  value={composerCitation}
                  onChange={(e) => setComposerCitation(e.target.value)}
                  placeholder="Add citation"
                  className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-black/20"
                />

                <div className="flex items-center gap-3">
                  <PrimaryButton onClick={() => void submitTopLevelComment()} disabled={actionLoading}>
                    {actionLoading ? "Posting…" : "Post Comment"}
                  </PrimaryButton>
                  <OutlineButton onClick={() => copyToClipboard(citation)} title="Copy citation">
                    Copy citation
                  </OutlineButton>
                  <OutlineButton onClick={() => copyShareLink()}>Copy link</OutlineButton>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-lg font-semibold text-zinc-900">Contributions</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContribTab("all")}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium",
                    contribTab === "all"
                      ? "bg-[rgba(0,102,255,0.1)] text-[var(--brand)]"
                      : `bg-zinc-100 text-zinc-600 ${clickableHoverInset}`,
                  ].join(" ")}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setContribTab("cited")}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium",
                    contribTab === "cited"
                      ? "bg-[rgba(0,102,255,0.1)] text-[var(--brand)]"
                      : `bg-zinc-100 text-zinc-600 ${clickableHoverInset}`,
                  ].join(" ")}
                >
                  Cited Contributions
                </button>
              </div>
              {/* MVP stub: contributions content can be wired to backend later. */}
            </div>

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
                            className={`rounded-md px-1.5 py-0.5 ${clickableHoverInset}`}
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

                          <button
                            type="button"
                            className={`rounded-md px-1.5 py-0.5 ${clickableHoverInset}`}
                            onClick={() => {
                              const origin =
                                typeof window !== "undefined" ? window.location.origin : "";
                              void copyToClipboard(
                                `${origin ? `${origin}${sharePath}` : sharePath}#comment-${c.id}`,
                              );
                            }}
                            disabled={!isLoggedIn}
                            title={!isLoggedIn ? "Login required" : "Copy comment link"}
                          >
                            Share
                          </button>

                          <button
                            type="button"
                            className={`rounded-md px-1.5 py-0.5 ${clickableHoverInset}`}
                            onClick={() => setReportingCommentId(c.id)}
                            disabled={!isLoggedIn}
                            title={!isLoggedIn ? "Login required" : "Report comment"}
                          >
                            Report
                          </button>
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

