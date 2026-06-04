"use client";

import { useMemo } from "react";
import { SuggestedPaperCard } from "@/components/SuggestedPaperCard";
import type { MockPost } from "@/lib/mockPosts";

type Props = {
  posts: MockPost[];
};

export function HomeSuggestedPapers({ posts }: Props) {
  const visible = useMemo(() => posts.slice(0, 4), [posts]);

  return (
    <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">Suggested Paper For You</div>
        <button
          type="button"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          View More
        </button>
      </div>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((p) => (
          <SuggestedPaperCard key={p.id} post={p} />
        ))}
      </ul>
    </div>
  );
}
