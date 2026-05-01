"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MockPost } from "@/lib/mockPosts";

type Props = {
  post: MockPost;
};

function buildApaLikeCitation(post: MockPost) {
  // MVP: simple placeholder citation format (not a full APA generator).
  const year = new Date().getFullYear();
  return `${post.authorName} (${year}). ${post.title}. Odd Academia.`;
}

type UiComment = {
  id: string;
  name: string;
  time: string;
  text: string;
};

const seededComments: UiComment[] = [
  {
    id: "c1",
    name: "Maude Hall",
    time: "14 min ago",
    text: "This analysis of Lego's business model is impressive. Can you elaborate on how their focus on community has impacted their success?",
  },
  {
    id: "c2",
    name: "Lydia Botosh",
    time: "14 min ago",
    text: "Great insights into Lego's innovative strategies! I'd love to know more about how they manage to stay relevant in the digital age.",
  },
  {
    id: "c3",
    name: "Rayna Vetrovs",
    time: "14 min ago",
    text: "Me too! Lego's adaptability is truly remarkable for a company that deals with toys to have such a good digital transition.",
  },
  {
    id: "c4",
    name: "Anika Schleifer",
    time: "14 min ago",
    text: "A fascinating read! What role does Lego's educational value play in its marketing and customer retention strategies?",
  },
  {
    id: "c5",
    name: "Madelyn Passaquindici Arcand",
    time: "14 min ago",
    text: "The paper covers Lego's history well. Any insights into their future plans and how they intend to maintain their competitive edge?",
  },
  {
    id: "c6",
    name: "Ahmad Bator",
    time: "14 min ago",
    text: "Yeah they are currently still growing at 20% YoY in terms of global revenue. Very impressive.",
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <span className="text-xs">●</span>
      </span>
      <span className="font-medium text-zinc-600">{label}:</span>
      <span className="font-semibold text-zinc-900">{value}</span>
    </div>
  );
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

export function PaperDetailClient({ post }: Props) {
  const [draft, setDraft] = useState("");

  const citation = useMemo(() => buildApaLikeCitation(post), [post]);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/paper/${post.id}`;

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
  }

  const [comments, setComments] = useState<UiComment[]>(seededComments);

  function submitComment() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setComments((prev) => [
      { id: `u_${Date.now()}`, name: "You", time: "Just now", text: trimmed },
      ...prev,
    ]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      {/* Author card */}
      <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            aria-label="Back"
          >
            ←
          </Link>

          <div className="h-14 w-14 overflow-hidden rounded-full bg-zinc-200" />

          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-zinc-900">
              Authored by {post.authorName}
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              {post.authorName} is a business analyst at a top Big 4 consultancy.
            </div>
          </div>
        </div>
      </section>

      {/* Reader + toolbar */}
      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-1 border-b border-black/[0.06] bg-white px-3 py-2">
          <ToolPill>Page 1 of 235</ToolPill>
          <ToolPill>Zoom</ToolPill>
          <ToolPill>Fullscreen</ToolPill>
          <ToolPill>Highlight</ToolPill>
          <ToolPill>Dark Mode</ToolPill>
        </div>

        <div className="bg-zinc-50 px-8 py-10">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600">
            {post.summary}
          </p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-600">
            {post.summary}
          </p>

          {post.fileType === "pdf" && post.fileUrl ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
              <iframe title="PDF reader" src={post.fileUrl} className="h-[70vh] w-full bg-white" />
            </div>
          ) : null}
        </div>
      </section>

      {/* Metrics row */}
      <section className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Metric label="Download" value="101" />
          <Metric label="Rate" value="87%" />
          <Metric label="Share" value="35" />
          <button
            type="button"
            onClick={() => copyToClipboard(citation)}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
            title="Copy citation"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <span className="text-xs">●</span>
            </span>
            <span className="font-medium text-zinc-600">Add Citation:</span>
            <span className="font-semibold text-zinc-900">35</span>
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(shareUrl)}
            className="ml-auto rounded-full border border-black/[0.06] bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Copy link
          </button>
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          Citation (simplified): <span className="font-medium">{citation}</span>
        </div>
      </section>

      {/* Word count */}
      <section className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4 shadow-[var(--shadow-sm)]">
        <div className="text-sm text-zinc-700">340 words</div>
      </section>

      {/* Comments */}
      <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Comments</div>

        <ul className="mt-4 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                {initials(c.name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-sm font-semibold text-zinc-900">{c.name}</div>
                  <div className="text-xs text-zinc-400">{c.time}</div>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{c.text}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                  <button type="button" className="hover:text-zinc-600">
                    Reply
                  </button>
                  <button type="button" className="hover:text-zinc-600">
                    Share
                  </button>
                  <button type="button" className="hover:text-zinc-600" aria-label="More">
                    …
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <div className="text-xs text-zinc-500">Comment</div>
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment…"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm outline-none focus:border-black/20"
            />
            <button
              type="button"
              onClick={submitComment}
              className="h-11 shrink-0 rounded-xl bg-[var(--brand)] px-5 text-sm font-medium text-white hover:opacity-95"
            >
              Post
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

