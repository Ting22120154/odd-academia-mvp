"use client";

import { formatDateLongAU, formatDateTimeAU } from "@odd-academia/db/date";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MockPost } from "@/lib/mockPosts";
import { EmbeddedPdfViewer } from "@/app/paper/_components/EmbeddedPdfViewer";
import { PaperPdfAttach } from "@/app/paper/_components/PaperPdfAttach";
import { GuestTracker } from "@/app/paper/_components/GuestTracker";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  createComment as createCommentApi,
  deleteComment as deleteCommentApi,
  fetchCommentsForPaper,
  likeComment as likeCommentApi,
  unlikeComment as unlikeCommentApi,
  updateComment as updateCommentApi,
} from "@/lib/comments-client";
import type { CommentResponse } from "@/modules/comments/types";
import { isValidUserId } from "@/lib/auth/user-id";
import { fetchFollowStatus, toggleFollow } from "@/lib/follow-client";
import {
  fetchPaperFollowStatus,
  togglePaperFollow,
} from "@/lib/paper-follow-client";
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

function formatAuthorApa(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Unknown";
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p[0]?.toUpperCase() ?? ""}.`)
    .join(" ");
  return initials ? `${last}, ${initials}` : last;
}

function buildApaCitation(post: MockPost, pageUrl: string) {
  const year = post.publishedAt
    ? new Date(post.publishedAt).getFullYear()
    : new Date().getFullYear();
  const author = formatAuthorApa(post.authorName);
  return `${author} (${year}). ${post.title}. Odd Academia. ${pageUrl}`;
}

const URL_IN_TEXT = /(https?:\/\/[^\s]+)/g;

function ReferenceLine({ text }: { text: string }) {
  const parts = text.split(URL_IN_TEXT);
  return (
    <li className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={`${i}-${part}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[var(--brand)] underline-offset-2 hover:underline ${linkHover}`}
          >
            {part}
          </a>
        ) : (
          <span key={`${i}-t`}>{part}</span>
        ),
      )}
    </li>
  );
}

function AbstractBlurb({ text }: { text: string }) {
  const [showFullAbstract, setShowFullAbstract] = useState(false);
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <div className="space-y-1">
      <p
        className={[
          "text-sm leading-6 text-zinc-500",
          showFullAbstract ? "" : "line-clamp-3",
        ].join(" ")}
      >
        {trimmed}
      </p>
      <button
        type="button"
        onClick={() => setShowFullAbstract((v) => !v)}
        className={`text-xs font-semibold text-[var(--brand)] ${linkHover}`}
      >
        {showFullAbstract ? "Read less" : "Read more"}
      </button>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CitationModal({
  open,
  onClose,
  citation,
}: {
  open: boolean;
  onClose: () => void;
  citation: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  if (!open) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cite-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-4">
          <div id="cite-title" className="text-base font-semibold text-zinc-900">
            Cite this paper
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
        <p className="mt-1 text-xs text-zinc-500">APA format</p>
        <p className="mt-4 rounded-xl border border-black/[0.06] bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700">
          {citation}
        </p>
        <div className="mt-5 flex justify-end">
          <PrimaryButton onClick={() => void handleCopy()} className="gap-2">
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

type UiReply = {
  id: string;
  authorId: string;
  isOwn: boolean;
  name: string;
  time: string;
  text: string;
  likes: number;
  likedByMe: boolean;
};

type UiComment = {
  id: string;
  authorId: string;
  isOwn: boolean;
  name: string;
  time: string;
  text: string;
  likes: number;
  likedByMe: boolean;
  replies: UiReply[];
};

function mapComment(c: CommentResponse, viewerId: string | null): UiComment {
  const isOwn =
    c.isOwn === true || Boolean(viewerId && c.user.id === viewerId);
  return {
    id: c.id,
    authorId: c.user.id,
    isOwn,
    name: c.user.fullName,
    time: formatDateTimeAU(c.createdAt),
    text: c.content,
    likes: c.likesCount,
    likedByMe: c.likedByMe ?? false,
    replies: c.replies.map((r) => ({
      id: r.id,
      authorId: r.user.id,
      isOwn: r.isOwn === true || Boolean(viewerId && r.user.id === viewerId),
      name: r.user.fullName,
      time: formatDateTimeAU(r.createdAt),
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

// Consolidated to a single reason field — subject + description were redundant
// for users; they added friction without capturing distinct information.
type ReportDraft = { reason: string };

function ReportModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: ReportDraft) => void;
  title: string;
  description: string;
}) {
  const [draft, setDraft] = useState<ReportDraft>({ reason: "" });

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
              {title}
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              {description}
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

        <div className="mt-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700" htmlFor="report-reason">
              Reason
            </label>
            <textarea
              id="report-reason"
              value={draft.reason}
              onChange={(e) => setDraft({ reason: e.target.value })}
              placeholder="Describe the issue clearly"
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
            disabled={!draft.reason.trim()}
          >
            Submit
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function formatPaperDate(value?: string) {
  return formatDateLongAU(value);
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PaperDetailClient({ post, commentsPaperId, relatedPosts = [] }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const { isLoggedIn, user: sessionUser } = useAuth();
  const currentUserId = sessionUser?.id ?? null;
  const authorId = post.authorId;
  const canFollowAuthor = Boolean(
    authorId && isValidUserId(authorId) && sessionUser?.id !== authorId,
  );
  const sharePath = `/paper/${post.id}`;
  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return sharePath;
    return `${window.location.origin}${sharePath}`;
  }, [sharePath]);
  const citation = useMemo(() => buildApaCitation(post, pageUrl), [post, pageUrl]);
  const abstractText = (post.abstract ?? post.summary ?? "").trim();
  const paperReferences = post.references ?? [];
  const fileApiSrc = `/api/papers/${post.id}/file`;
  const hasPdf = post.fileType === "pdf" && Boolean(post.fileUrl);
  const [pdfFileOk, setPdfFileOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!hasPdf) {
      setPdfFileOk(false);
      return;
    }
    let cancelled = false;
    void fetch(fileApiSrc, { method: "HEAD", credentials: "include" })
      .then((res) => {
        if (!cancelled) setPdfFileOk(res.ok);
      })
      .catch(() => {
        if (!cancelled) setPdfFileOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasPdf, fileApiSrc]);

  const isPaperOwner = Boolean(
    sessionUser?.id && authorId && sessionUser.id === authorId,
  );
  // Admins moderate content; they should not participate as regular users.
  // ApiRole uses uppercase ("ADMIN") per frontend/src/lib/auth/types.ts.
  const isAdmin = sessionUser?.role === "ADMIN";

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
  const [authorFollowerCount, setAuthorFollowerCount] = useState(0);
  const [followAuthorBusy, setFollowAuthorBusy] = useState(false);
  const [comments, setComments] = useState<UiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportingPaper, setReportingPaper] = useState(false);
  const [citeModalOpen, setCiteModalOpen] = useState(false);

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
    if (!authorId || !isValidUserId(authorId)) {
      setFollowAuthor(false);
      setAuthorFollowerCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const { isFollowing, followerCount } = await fetchFollowStatus(authorId);
      if (cancelled) return;
      setFollowAuthor(isLoggedIn && canFollowAuthor ? !!isFollowing : false);
      if (typeof followerCount === "number") setAuthorFollowerCount(followerCount);
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, authorId, canFollowAuthor]);

  const handleFollowAuthor = useCallback(async () => {
    if (!authorId || !canFollowAuthor || followAuthorBusy) return;
    if (!isLoggedIn) { router.push("/login"); return; }
    setFollowAuthorBusy(true);
    const { isFollowing, error } = await toggleFollow(authorId, followAuthor);
    setFollowAuthorBusy(false);
    if (!error && typeof isFollowing === "boolean") {
      setFollowAuthor(isFollowing);
      setAuthorFollowerCount((c) => Math.max(0, c + (isFollowing ? 1 : -1)));
    }
  }, [authorId, canFollowAuthor, followAuthor, followAuthorBusy, isLoggedIn, router]);

  const followAuthorSidebarLabel = followAuthorBusy ? "…" : followAuthor ? "Following" : "Follow";
  const followPaperLabel = followPaperBusy ? "…" : followPaper ? "Following Paper" : "Follow Paper";
  const followAuthorMainLabel = followAuthorBusy ? "…" : followAuthor ? "Following Author" : "Follow Author";

  const contributorLine = (post.contributors ?? []).length
    ? `Contributions by ${(post.contributors ?? []).join(", ")}`
    : null;
  const metaTags = [
    formatPaperDate(post.publishedAt),
    ...(post.tags ?? post.categories ?? []).slice(0, 2),
  ].filter(Boolean);
  const authorProfileHref = authorId && isValidUserId(authorId) ? `/user/${authorId}` : null;

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

  const [composer, setComposer] = useState("");
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const loadComments = useCallback(async () => {
    if (!commentsPaperId) {
      setComments([]);
      return;
    }
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const { comments: rows, viewerId } = await fetchCommentsForPaper(commentsPaperId);
      const whoami = viewerId ?? currentUserId;
      setComments(rows.map((row) => mapComment(row, whoami)));
    } catch {
      setCommentsError("Could not load comments.");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [commentsPaperId, currentUserId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash.startsWith("#comment-")) return;

    const targetId = hash.slice(1);
    let cancelled = false;
    let attempts = 0;

    const scrollToComment = () => {
      if (cancelled) return;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[var(--brand)]", "ring-offset-2", "rounded-xl");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-[var(--brand)]", "ring-offset-2", "rounded-xl");
        }, 2500);
        return;
      }
      if (attempts < 20) {
        attempts += 1;
        window.setTimeout(scrollToComment, 300);
      }
    };

    scrollToComment();
    return () => {
      cancelled = true;
    };
  }, [commentsLoading, comments]);

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

  function isOwnComment(comment: { authorId: string; isOwn: boolean }) {
    return comment.isOwn || Boolean(currentUserId && comment.authorId === currentUserId);
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

  async function submitReport(commentId: string, draft: ReportDraft) {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ type: "comment", commentId, reason: draft.reason.trim() }),
    }).catch(() => null);
    setReportingCommentId(null);
    showToast("Report submitted. Our team will review it.", "success");
  }

  async function submitPaperReport(draft: ReportDraft) {
    if (!commentsPaperId) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type: "paper",
        paperId: commentsPaperId,
        subject: "Paper report",
        reason: draft.reason.trim(),
      }),
    });
    setReportingPaper(false);
    if (res.ok) showToast("Report submitted. Our team will review it.", "success");
    else showToast("Could not submit report. Please try again.", "error");
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.authorAvatarUrl ?? "/avatars/profile.svg"}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover bg-zinc-200"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{post.authorName}</div>
                {post.authorJobTitle ? (
                  <div className="text-xs text-zinc-500">{post.authorJobTitle}</div>
                ) : null}
              </div>
            </div>
            {post.authorBio ? (
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-zinc-500">{post.authorBio}</p>
            ) : null}
            {authorProfileHref ? (
              <Link href={authorProfileHref} className={`mt-2 inline-block text-sm font-semibold text-[var(--brand)] ${linkHover}`}>
                Read More…
              </Link>
            ) : null}

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
                  Follow
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
                {abstractText ? <AbstractBlurb text={abstractText} /> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.authorAvatarUrl ?? "/avatars/profile.svg"}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full object-cover bg-zinc-200"
                />
                <p className="text-sm text-zinc-600">
                  Authored by{" "}
                  {authorProfileHref ? (
                    <Link href={authorProfileHref} className="font-semibold text-zinc-900 hover:underline">
                      {post.authorName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-zinc-900">{post.authorName}</span>
                  )}
                </p>
              </div>
              {contributorLine ? (
                <p className="text-sm text-zinc-500">{contributorLine}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {metaTags.map((tag, i) => (
                <Chip key={`${tag}-${i}`} icon={i === 0 ? "📅" : i === 1 ? "🌿" : "✦"}>
                  {tag}
                </Chip>
              ))}
            </div>

            {/* Figma: Follow Paper + Follow Author side by side */}
            {isLoggedIn ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PrimaryButton
                    onClick={() => void handleFollowPaper()}
                    disabled={followPaperBusy}
                    aria-pressed={followPaper}
                    className="w-full justify-between px-4"
                  >
                    <span className="flex items-center gap-2">
                      <PlusIcon />
                      {followPaperLabel}
                    </span>
                    <span className="text-white/90">{paperFollowerCount}</span>
                  </PrimaryButton>
                  {canFollowAuthor ? (
                    <PrimaryButton
                      onClick={() => void handleFollowAuthor()}
                      disabled={followAuthorBusy}
                      aria-pressed={followAuthor}
                      className="w-full justify-between px-4"
                    >
                      <span className="flex items-center gap-2">
                        <PersonIcon />
                        {followAuthorMainLabel}
                      </span>
                      <span className="text-white/90">{authorFollowerCount}</span>
                    </PrimaryButton>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setReportingPaper(true)}
                    className="font-medium text-zinc-500 hover:text-zinc-800 hover:underline"
                  >
                    Report paper
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white hover:opacity-95"
                >
                  <PlusIcon />
                  Follow Paper
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white hover:opacity-95"
                >
                  <PersonIcon />
                  Follow Author
                </Link>
              </div>
            )}
          </section>

          {/* Reader — embedded PDF (no browser native viewer) */}
          {hasPdf && pdfFileOk === null ? (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center text-sm text-zinc-500 shadow-[var(--shadow-sm)]">
              Loading PDF…
            </section>
          ) : hasPdf && pdfFileOk === false ? (
            isPaperOwner ? (
              <PaperPdfAttach
                paperId={post.id}
                onAttached={() => router.refresh()}
              />
            ) : (
              <section className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center text-sm text-zinc-600 shadow-[var(--shadow-sm)]">
                The PDF for this paper is not available yet.
              </section>
            )
          ) : hasPdf ? (
            <EmbeddedPdfViewer
              fileSrc={fileApiSrc}
              shareCount={0}
              citationCount={post.citationCount ?? 0}
              onShare={() => void copyShareLink()}
              onCite={() => setCiteModalOpen(true)}
            />
          ) : post.fileUrl ? (
            <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 text-center shadow-[var(--shadow-sm)]">
              <p className="text-sm text-zinc-600">
                This paper is not available as an in-browser PDF preview.
              </p>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-dashed border-black/[0.12] bg-white p-8 text-center text-sm text-zinc-500 shadow-[var(--shadow-sm)]">
              No document has been uploaded for this paper yet.
            </section>
          )}

          {paperReferences.length > 0 ? (
            <section className="space-y-3 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
              <div className="text-sm font-semibold text-zinc-900">References</div>
              <ul className="space-y-2">
                {paperReferences.map((ref) => (
                  <ReferenceLine key={ref.id} text={ref.citationText} />
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
            {/* Comments composer is login-gated (per Figma). */}
            {!isLoggedIn ? (
              <Link
                href="/login"
                className={`inline-flex h-10 w-fit items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-medium text-white ${brandButtonHover}`}
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
                          {/* Admins moderate content and cannot like comments */}
                          {!isAdmin ? (
                            <CommentLikeButton
                              count={c.likes}
                              liked={c.likedByMe}
                              disabled={!isLoggedIn}
                              onClick={() => void toggleCommentLike(c.id)}
                            />
                          ) : null}

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

                          {isOwnComment(c) && editingCommentId !== c.id ? (
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

                          {/* Users cannot report their own comments */}
                          {isLoggedIn && !isOwnComment(c) ? (
                            <button
                              type="button"
                              className={`rounded-md px-1.5 py-0.5 ${clickableHoverInset}`}
                              onClick={() => setReportingCommentId(c.id)}
                              title="Report comment"
                            >
                              Report
                            </button>
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
                                {!isAdmin ? (
                                  <CommentLikeButton
                                    count={r.likes}
                                    liked={r.likedByMe}
                                    disabled={!isLoggedIn}
                                    onClick={() => void toggleCommentLike(r.id)}
                                  />
                                ) : null}

                                {isOwnComment(r) && editingCommentId !== r.id ? (
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

                                {isLoggedIn && !isOwnComment(r) ? (
                                  <button
                                    type="button"
                                    className={`rounded-md px-1.5 py-0.5 ${clickableHoverInset}`}
                                    onClick={() => setReportingCommentId(r.id)}
                                    title="Report comment"
                                  >
                                    Report
                                  </button>
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

      <ReportModal
        open={reportingCommentId !== null}
        onClose={() => setReportingCommentId(null)}
        title="Report comment"
        description="Help us understand what went wrong."
        onSubmit={(draft) => void submitReport(reportingCommentId ?? "", draft)}
      />
      <ReportModal
        open={reportingPaper}
        onClose={() => setReportingPaper(false)}
        title="Report paper"
        description="Tell us why this paper should be reviewed."
        onSubmit={(draft) => void submitPaperReport(draft)}
      />
      <CitationModal
        open={citeModalOpen}
        onClose={() => setCiteModalOpen(false)}
        citation={citation}
      />
    </div>
  );
}

