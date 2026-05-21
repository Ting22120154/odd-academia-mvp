import type { CommentResponse } from "@/modules/comments/types";

type ApiSuccess<T> = { success: true } & T;
type ApiError = { success: false; error: string };

async function parseJson<T>(res: Response): Promise<T | ApiError> {
  return res.json() as Promise<T | ApiError>;
}

/** GET /api/comments/paper/:paperId — public threaded list */
export async function fetchCommentsForPaper(paperId: string): Promise<CommentResponse[]> {
  const res = await fetch(`/api/comments/paper/${paperId}`, { cache: "no-store" });
  const data = await parseJson<ApiSuccess<{ comments: CommentResponse[] }>>(res);
  if (!data.success) return [];
  return data.comments;
}

/** PUT /api/comments/:id */
export async function updateComment(
  commentId: string,
  content: string,
): Promise<{ ok: true; comment: CommentResponse } | { ok: false; error: string }> {
  const res = await fetch(`/api/comments/${commentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  const data = await parseJson<ApiSuccess<{ comment: CommentResponse }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true, comment: data.comment };
}

/** DELETE /api/comments/:id */
export async function deleteComment(
  commentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/comments/${commentId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ deleted: boolean }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true };
}
