"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getMockPostById } from "@/lib/mockPosts";
import { formatSavedAt } from "@/lib/format-saved-at";
import {
  fetchSavedPapers,
  unsavePaper as unsavePaperApi,
} from "@/lib/saved-papers-client";
import { notifySavedPapersChanged } from "@/lib/saved-papers-events";
import { useToast } from "@/context/ToastContext";
import type { SavedPaperResponse } from "@/modules/saved-papers/types";

type Props = {
  /** When true, reload list (e.g. profile tab selected). */
  active?: boolean;
  onCountChange?: (count: number) => void;
  emptyMessage?: string;
};

export function SavedPapersList({
  active = true,
  onCountChange,
  emptyMessage = "No saved papers yet. Save papers from the home feed or paper page.",
}: Props) {
  const { showToast } = useToast();
  const [papers, setPapers] = useState<SavedPaperResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { papers: list, count } = await fetchSavedPapers();
    setPapers(list);
    onCountChange?.(count);
    setLoading(false);
  }, [onCountChange]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  useEffect(() => {
    const onChanged = () => void load();
    window.addEventListener("odd:saved-papers-changed", onChanged);
    return () => window.removeEventListener("odd:saved-papers-changed", onChanged);
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && active) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, load]);

  async function handleRemove(paperId: string) {
    setRemovingId(paperId);
    const result = await unsavePaperApi(paperId);
    setRemovingId(null);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast("Removed from saved papers", "success");
    notifySavedPapersChanged();
    await load();
  }

  if (loading && papers.length === 0) {
    return <p className="text-sm text-zinc-500">Loading saved papers…</p>;
  }

  if (papers.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {papers.map((p) => (
        <SavedPaperCard
          key={p.paperId}
          paper={p}
          removing={removingId === p.paperId}
          onRemove={() => void handleRemove(p.paperId)}
        />
      ))}
    </div>
  );
}

function SavedPaperCard({
  paper,
  removing,
  onRemove,
}: {
  paper: SavedPaperResponse;
  removing: boolean;
  onRemove: () => void;
}) {
  const mockPost = paper.routeId ? getMockPostById(paper.routeId) : null;
  const headerClass =
    mockPost?.headerGradientClass ??
    "bg-gradient-to-br from-indigo-400 via-blue-500 to-purple-600";

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
      <Link href={`/paper/${paper.paperId}`} className="block flex-1">
        <div className={`h-32 w-full ${headerClass}`} aria-hidden />
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900">{paper.title}</h3>
          <p className="mt-1 text-xs font-medium text-zinc-600">{paper.author.fullName}</p>
          {paper.abstract ? (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{paper.abstract}</p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-400">Saved {formatSavedAt(paper.savedAt)}</p>
        </div>
      </Link>
      <div className="flex items-center gap-2 border-t border-black/[0.06] px-3 py-2">
        <Link
          href={`/paper/${paper.paperId}`}
          className="text-xs font-medium text-[var(--brand)] hover:underline"
        >
          Open paper
        </Link>
        <button
          type="button"
          disabled={removing}
          onClick={onRemove}
          className="ml-auto text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
    </article>
  );
}
