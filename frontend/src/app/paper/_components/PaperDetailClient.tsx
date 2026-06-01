"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MockPost } from "@/lib/mockPosts";
import { EmbeddedPdfViewer } from "@/app/paper/_components/EmbeddedPdfViewer";
import { GuestTracker } from "@/app/paper/_components/GuestTracker";
import { useAuth } from "@/context/AuthContext";
import { mockUser } from "@/data/mockUser";
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
  name: string;
  time: string;
  text: string;
};

type UiComment = {
  id: string;
  name: string;
  time: string;
  text: string;
  likes: number;
  replies: UiReply[];
};

const seededComments: UiComment[] = [
  {
    id: "c1",
    name: "Alexander",
    time: "3 hr. ago",
    text: "This paper offers some insightful perspectives on sustainable energy, but I feel like it underestimates the challenges of implementing these practices in older urban infrastructures. How can cities retrofit without massive costs or disruptions?",
    likes: 2,
    replies: [
      {
        id: "r1",
        name: "Sophia",
        time: "14 min ago",
        text: "That's a valid point. The paper does touch on retrofitting but focuses more on policy frameworks. Maybe the authors could have explored case studies on cities that have successfully integrated these changes without major disruptions?",
      },
    ],
  },
  {
    id: "c2",
    name: "Jordan",
    time: "1 day ago",
    text: "Would love to see a comparison against a real-world city that has measured emissions savings from these interventions.",
    likes: 0,
    replies: [],
  },
];

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
  title = "Report comment",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: ReportDraft) => void;
  title?: string;
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
              {title}
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

export function PaperDetailClient({ post, relatedPosts = [] }: Props) {
  const router = useRouter();
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
  const [comments, setComments] = useState<UiComment[]>(seededComments);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { isFollowing, followerCount } = await fetchPaperFollowStatus(post.id);
      if (cancelled) return;
      setFollowPaper(!!isFollowing);
      setPaperFollowerCount(followerCount);
    })();
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, authorId, canFollowAuthor]);

  const handleFollowAuthor = useCallback(async () => {
    if (!authorId || !canFollowAuthor || followAuthorBusy) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setFollowAuthorBusy(true);
    const { isFollowing, error } = await toggleFollow(authorId, followAuthor);
    setFollowAuthorBusy(false);
    if (!error && typeof isFollowing === "boolean") {
      setFollowAuthor(isFollowing);
    }
  }, [
    authorId,
    canFollowAuthor,
    followAuthor,
    followAuthorBusy,
    isLoggedIn,
    router,
  ]);

  const followAuthorLabel = followAuthorBusy
    ? "…"
    : followAuthor
      ? "Unfollow"
      : "Follow Author";
  const followAuthorSidebarLabel = followAuthorBusy
    ? "…"
    : followAuthor
      ? "Unfollow"
      : "Follow";

  const handleFollowPaper = useCallback(async () => {
    if (followPaperBusy) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setFollowPaperBusy(true);
    const { isFollowing, followerCount, error } = await togglePaperFollow(
      post.id,
      followPaper,
    );
    setFollowPaperBusy(false);
    if (!error) {
      if (typeof isFollowing === "boolean") setFollowPaper(isFollowing);
      if (typeof followerCount === "number") setPaperFollowerCount(followerCount);
    }
  }, [followPaper, followPaperBusy, isLoggedIn, post.id, router]);

  const followPaperLabel = followPaperBusy
    ? "…"
    : followPaper
      ? "Unfollow Paper"
      : "Follow Paper";

  const [composer, setComposer] = useState("");
  const [composerCitation, setComposerCitation] = useState("");
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportingPaper, setReportingPaper] = useState(false);
  const [contribTab, setContribTab] = useState<"all" | "cited">("all");

  const related = relatedPosts;

  function submitTopLevelComment() {
    const trimmed = composer.trim();
    if (!trimmed) return;
    setComments((prev) => [
      { id: `u_${Date.now()}`, name: "You", time: "Just now", text: trimmed, likes: 0, replies: [] },
      ...prev,
    ]);
    setComposer("");
    setComposerCitation("");
  }

  function submitReply(commentId: string) {
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [
                ...c.replies,
                { id: `r_${Date.now()}`, name: "You", time: "Just now", text: trimmed },
              ],
            }
          : c
      )
    );
    setReplyDraft("");
    setActiveReplyFor(null);
  }

  async function submitReport(draft: ReportDraft) {
    if (!reportingCommentId || !user) return;
    const res = await fetch("/api/reports", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type:      "comment",
        commentId: reportingCommentId,
        reason:    draft.subject ? `${draft.subject}: ${draft.description}` : draft.description,
      }),
    });
    if (!res.ok) console.error("Comment report failed", await res.json().catch(() => null));
    setReportingCommentId(null);
  }

  async function submitPaperReport(draft: ReportDraft) {
    if (!user) return;
    const res = await fetch("/api/reports", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type:       "paper",
        paperId:    post.id,
        paperTitle: post.title,
        subject:    draft.subject,
        reason:     draft.description,
      }),
    });
    if (!res.ok) console.error("Paper report failed", await res.json().catch(() => null));
    setReportingPaper(false);
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
              <Chip icon="📅">10-11-2024</Chip>
              <Chip icon="✦">{(post.tags ?? [])[0] ?? post.subject ?? "AI infrastructure"}</Chip>
            </div>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setReportingPaper(true)}
                title="Report this paper"
                aria-label="Report this paper"
                className="inline-flex items-center gap-1.5 self-start rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                Report
              </button>
            )}

            {/* Follow row is only visible after login (per Figma). */}
            {isLoggedIn ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PrimaryButton
                  onClick={() => void handleFollowPaper()}
                  disabled={followPaperBusy}
                  aria-pressed={followPaper}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    ⤴ {followPaperLabel}
                  </span>
                  <span className="text-white/90">{paperFollowerCount}</span>
                </PrimaryButton>
                {canFollowAuthor ? (
                  <PrimaryButton
                    onClick={() => void handleFollowAuthor()}
                    disabled={followAuthorBusy}
                    aria-pressed={followAuthor}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      👤 {followAuthorLabel}
                    </span>
                    <span className="text-white/90">35</span>
                  </PrimaryButton>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Reader — embedded PDF (no browser native viewer) */}
          {hasPdf ? (
            <EmbeddedPdfViewer
              fileSrc={fileApiSrc}
              downloadFilename={downloadFilename}
              downloadCount={101}
              shareCount={35}
              citationCount={35}
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
                  <PrimaryButton onClick={submitTopLevelComment}>Post Comment</PrimaryButton>
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
                        <p className="mt-2 text-sm leading-7 text-zinc-700">{c.text}</p>

                        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
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
                            <PrimaryButton onClick={() => submitReply(c.id)}>Reply</PrimaryButton>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {c.replies.length > 0 ? (
                      <ul className="ml-12 space-y-4 border-l border-black/[0.06] pl-6">
                        {c.replies.map((r) => (
                          <li key={r.id} className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                              {initials(r.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <div className="text-sm font-semibold text-zinc-900">{r.name}</div>
                                <div className="text-xs text-zinc-400">{r.time}</div>
                              </div>
                              <p className="mt-2 text-sm leading-7 text-zinc-700">{r.text}</p>
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
        onSubmit={submitReport}
      />
      <ReportModal
        open={reportingPaper}
        onClose={() => setReportingPaper(false)}
        onSubmit={submitPaperReport}
        title="Report paper"
      />
    </div>
  );
}

