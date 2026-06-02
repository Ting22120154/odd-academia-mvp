"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { SuggestedPaperCard } from "@/components/SuggestedPaperCard";
import type { MockPost } from "@/lib/mockPosts";
import {
  fetchPaperRoutes,
  fetchSavedPapers,
  savePaper,
  unsavePaper,
} from "@/lib/saved-papers-client";
import { notifySavedPapersChanged } from "@/lib/saved-papers-events";

type Props = {
  posts: MockPost[];
};

export function HomeSuggestedPapers({ posts }: Props) {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [routeToPaperId, setRouteToPaperId] = useState<Record<string, string>>({});
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const refreshSaved = useCallback(async () => {
    if (!isLoggedIn) {
      setSavedPaperIds(new Set());
      return;
    }
    const { papers } = await fetchSavedPapers();
    setSavedPaperIds(new Set(papers.map((p) => p.paperId)));
  }, [isLoggedIn]);

  useEffect(() => {
    void fetchPaperRoutes().then(setRouteToPaperId);
  }, []);

  useEffect(() => {
    void refreshSaved();
  }, [refreshSaved]);

  useEffect(() => {
    const onChanged = () => void refreshSaved();
    window.addEventListener("odd:saved-papers-changed", onChanged);
    return () => window.removeEventListener("odd:saved-papers-changed", onChanged);
  }, [refreshSaved]);

  const visible = useMemo(() => posts.slice(0, 4), [posts]);

  async function toggleSave(routeId: string) {
    const paperId = routeToPaperId[routeId];
    if (!paperId) {
      showToast("This paper cannot be saved yet.", "error");
      return;
    }
    if (!isLoggedIn) {
      showToast("Log in to save papers.", "error");
      return;
    }

    const isSaved = savedPaperIds.has(paperId);
    setLoadingId(paperId);
    const result = isSaved ? await unsavePaper(paperId) : await savePaper(paperId);
    setLoadingId(null);

    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }

    setSavedPaperIds((prev) => {
      const next = new Set(prev);
      if (result.saved) next.add(paperId);
      else next.delete(paperId);
      return next;
    });
    notifySavedPapersChanged();
    showToast(result.saved ? "Paper saved" : "Removed from saved papers", "success");
  }

  return (
    <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">Suggested Paper For You</div>
        {isLoggedIn ? (
          <Link
            href="/saved-papers"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Saved papers
          </Link>
        ) : (
          <button
            type="button"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            View More
          </button>
        )}
      </div>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((p) => {
          const paperId = routeToPaperId[p.id] ?? null;
          return (
            <SuggestedPaperCard
              key={p.id}
              post={p}
              paperId={paperId}
              showSave={isLoggedIn && Boolean(paperId)}
              saved={paperId ? savedPaperIds.has(paperId) : false}
              saveLoading={paperId ? loadingId === paperId : false}
              onToggleSave={() => void toggleSave(p.id)}
            />
          );
        })}
      </ul>
    </div>
  );
}
