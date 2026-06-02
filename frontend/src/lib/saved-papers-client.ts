import type { SavedPaperResponse } from "@/modules/saved-papers/types";

type ApiSuccess<T> = { success: true } & T;
type ApiError = { success: false; error: string };

async function parseJson<T>(res: Response): Promise<T | ApiError> {
  return res.json() as Promise<T | ApiError>;
}

/** GET /api/papers/:paperId/save */
export async function fetchPaperSaveStatus(
  paperId: string,
): Promise<{ saved: boolean } | null> {
  const res = await fetch(`/api/papers/${paperId}/save`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ paperId: string; saved: boolean }>>(res);
  if (!data.success) return null;
  return { saved: data.saved };
}

/** POST /api/papers/:paperId/save */
export async function savePaper(
  paperId: string,
): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }> {
  const res = await fetch(`/api/papers/${paperId}/save`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ paperId: string; saved: boolean }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true, saved: data.saved };
}

/** DELETE /api/papers/:paperId/save */
export async function unsavePaper(
  paperId: string,
): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }> {
  const res = await fetch(`/api/papers/${paperId}/save`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ paperId: string; saved: boolean }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true, saved: data.saved };
}

/** GET /api/saved-papers */
export async function fetchSavedPapers(): Promise<{
  papers: SavedPaperResponse[];
  count: number;
}> {
  const res = await fetch("/api/saved-papers", {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ papers: SavedPaperResponse[]; count: number }>>(res);
  if (!data.success) return { papers: [], count: 0 };
  return { papers: data.papers, count: data.count };
}

/** GET /api/papers/routes — mock route id → Neon paper id */
export async function fetchPaperRoutes(): Promise<Record<string, string>> {
  const res = await fetch("/api/papers/routes", { cache: "no-store" });
  const data = await parseJson<
    ApiSuccess<{ routes: { routeId: string; paperId: string }[] }>
  >(res);
  if (!data.success) return {};
  return Object.fromEntries(data.routes.map((r) => [r.routeId, r.paperId]));
}
