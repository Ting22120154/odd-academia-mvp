"use client";

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

export function PaperDetailClient({ post }: Props) {
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const citation = useMemo(() => buildApaLikeCitation(post), [post]);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `/paper/${post.id}`;

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
  }

  function submitComment() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setComments((prev) => [trimmed, ...prev]);
    setDraft("");
  }

  return (
    <aside className="flex flex-col gap-4">
      <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            className="rounded-full border border-black/[0.08] bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {liked ? "Liked" : "Like"}
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(shareUrl)}
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Share
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(citation)}
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Copy citation
          </button>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Citation (simplified): <span className="font-medium">{citation}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
        <div className="text-sm font-semibold text-zinc-900">Comments</div>

        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            className="h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-sm outline-none focus:border-black/20"
          />
          <button
            type="button"
            onClick={submitComment}
            className="h-10 shrink-0 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white"
          >
            Post
          </button>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {comments.length === 0 ? (
            <li className="text-sm text-zinc-500">No comments yet.</li>
          ) : (
            comments.map((c, idx) => (
              <li
                key={`${idx}-${c.slice(0, 12)}`}
                className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-800"
              >
                {c}
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}

