"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

const GUEST_LIMIT = 5;
const LS_KEY = "guestViewedPapers";

function readViewedPapers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function useGuestAccess() {
  const { isGuest } = useAuth();

  // Read fresh from localStorage each render (not stored in state) to avoid
  // stale closures when multiple views are recorded in a session.
  const viewedPapers = isGuest ? readViewedPapers() : [];
  const viewedCount = viewedPapers.length;
  const hasReachedLimit = viewedCount >= GUEST_LIMIT;

  const recordArticleView = useCallback(
    (paperId: string): boolean => {
      if (!isGuest) return false;
      const current = readViewedPapers();
      // Deduplicated — re-visiting the same paper doesn't count again
      if (current.includes(paperId)) return current.length >= GUEST_LIMIT;
      const updated = [...current, paperId];
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated.length >= GUEST_LIMIT;
    },
    [isGuest]
  );

  return { isGuest, viewedCount, hasReachedLimit, recordArticleView };
}
