"use client";

import { useEffect, useState } from "react";
import type { MockPost } from "@/lib/mockPosts";
import {
  fetchPublishedPapers,
  type FetchPublishedPapersOptions,
} from "@/lib/papers/api";

/**
 * Loads published papers from the database via `/api/papers`.
 * Use this hook on client pages instead of `mockPosts`.
 */
export function usePublishedPapers(options: FetchPublishedPapersOptions = {}) {
  const { limit = 50, authorId } = options;
  const [papers, setPapers] = useState<MockPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const posts = await fetchPublishedPapers({ limit, authorId });
        if (!cancelled) setPapers(posts);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load papers");
          setPapers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit, authorId]);

  return { papers, loading, error };
}
