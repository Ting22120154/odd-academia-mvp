import { mapApiPaperToViewerPost, type ApiPaper } from "@/lib/mapApiPaper";
import type { MockPost } from "@/lib/mockPosts";

export type FetchPublishedPapersOptions = {
  limit?: number;
  authorId?: string;
};

/** Client-side fetch — always reads from `/api/papers` (database). */
export async function fetchPublishedPapers(
  options: FetchPublishedPapersOptions = {},
): Promise<MockPost[]> {
  const limit = options.limit ?? 50;
  const params = new URLSearchParams({ limit: String(limit) });
  if (options.authorId) params.set("authorId", options.authorId);

  const res = await fetch(`/api/papers?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not load papers from the database");
  }

  const data = (await res.json()) as { posts?: ApiPaper[] };
  return (data.posts ?? []).map(mapApiPaperToViewerPost);
}
