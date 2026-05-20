"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MockPost } from "@/lib/mockPosts";
import { GuestTracker } from "@/app/paper/_components/GuestTracker";
import { mockPosts } from "@/lib/mockPosts";
import { mockUser } from "@/data/mockUser";
import { useAuth } from "@/context/AuthContext";

type Props = {
  post: MockPost;
};

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

export function PaperDetailClient({ post }: Props) {
  const citation = useMemo(() => buildApaLikeCitation(post), [post]);
  const { user } = useAuth();

  // For this frontend-only MVP we infer login state from the same storage keys as the auth PR.
  // This keeps the paper viewer compatible once AuthContext is merged, without hard-coupling.
  const isLoggedIn = useMemo(() => {
    if (typeof window === "undefined") return false;
    const sessionCookie = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("auth-session="))
      ?.split("=")[1];
    if (sessionCookie === "user") return true;
    return Boolean(localStorage.getItem("authUser"));
  }, []);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/paper/${post.id}`;

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
  }

  const [followPaper, setFollowPaper] = useState(false);
  const [followAuthor, setFollowAuthor] = useState(false);
  const [comments, setComments] = useState<UiComment[]>(seededComments);
  const [composer, setComposer] = useState("");
  const [composerCitation, setComposerCitation] = useState("");
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportingPaper, setReportingPaper] = useState(false);
  const [contribTab, setContribTab] = useState<"all" | "cited">("all");

  const related = useMemo(() => {
    // Related papers are mocked by "same subject OR shared tag", excluding current post.
    return mockPosts
      .filter((p) => p.id !== post.id)
      .filter((p) => p.subject === post.subject || (p.tags ?? []).some((t) => (post.tags ?? []).includes(t)))
      .slice(0, 3);
  }, [post.id, post.subject, post.tags]);

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
    const commentId = reportingCommentId;
    if (!commentId || !user) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "comment",
        commentId,
        reporterId: user.id,
        reason: draft.subject ? `${draft.subject}: ${draft.description}` : draft.description,
      }),
    });
    setReportingCommentId(null);
  }

  async function submitPaperReport(draft: ReportDraft) {
    if (!user) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "paper",
        paperId: post.id,
        reporterId: user.id,
        subject: draft.subject,
        reason: draft.description,
      }),
    });
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
                <span className="hidden text-zinc-300 sm:inline">•</span>
                <span>Contributions by Dr. Katherine Johnson</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip icon="📅">10-11-2024</Chip>
              <Chip icon="🏷️">{post.subject}</Chip>
              <Chip icon="＋">{(post.tags ?? [])[0] ?? "AI infrastructure"}</Chip>
            </div>

            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setReportingPaper(true)}
                className="text-xs text-zinc-400 hover:text-red-500 underline-offset-2 hover:underline"
              >
                Report this paper
              </button>
            )}

            {/* Follow row is only visible after login (per Figma). */}
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
            ) : null}
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
                  <OutlineButton onClick={() => copyToClipboard(shareUrl)}>Copy link</OutlineButton>
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
                    contribTab === "all" ? "bg-[rgba(0,102,255,0.1)] text-[var(--brand)]" : "bg-zinc-100 text-zinc-600",
                  ].join(" ")}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setContribTab("cited")}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium",
                    contribTab === "cited" ? "bg-[rgba(0,102,255,0.1)] text-[var(--brand)]" : "bg-zinc-100 text-zinc-600",
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
                            className="hover:text-zinc-600"
                            onClick={() => {
                              if (!isLoggedIn) return;
                              setActiveReplyFor((prev) => (prev === c.id ? null : c.id));
                            }}
                          >
                            {c.replies.length > 0 ? `${c.replies.length} Reply` : "Reply"}
                          </button>

                          <button
                            type="button"
                            className="hover:text-zinc-600"
                            onClick={() => copyToClipboard(`${shareUrl}#comment-${c.id}`)}
                            disabled={!isLoggedIn}
                            title={!isLoggedIn ? "Login required" : "Copy comment link"}
                          >
                            Share
                          </button>

                          <button
                            type="button"
                            className="hover:text-zinc-600"
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

