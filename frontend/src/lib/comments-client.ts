import type { CommentResponse } from "@/modules/comments/types";

type ApiSuccess<T> = { success: true } & T;
type ApiError = { success: false; error: string };

async function parseJson<T>(res: Response): Promise<T | ApiError> {
  return res.json() as Promise<T | ApiError>;
}

/** POST /api/comments — create top-level comment or reply */
export async function createComment(
  paperId: string,
  content: string,
  opts?: { parentCommentId?: string; citation?: string },
): Promise<{ ok: true; comment: CommentResponse } | { ok: false; error: string }> {
  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      paperId,
      content,
      parentCommentId: opts?.parentCommentId,
      citation: opts?.citation,
    }),
  });
  const data = await parseJson<ApiSuccess<{ comment: CommentResponse }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true, comment: data.comment };
}

/** POST /api/comments/:id/like */
export async function likeComment(
  commentId: string,
): Promise<
  { ok: true; commentId: string; liked: boolean; likesCount: number } | { ok: false; error: string }
> {
  const res = await fetch(`/api/comments/${commentId}/like`, {
    method: "POST",
    credentials: "include",
  });
  const data = await parseJson<
    ApiSuccess<{ commentId: string; liked: boolean; likesCount: number }>
  >(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true, ...data };
}

/** DELETE /api/comments/:id/like */
export async function unlikeComment(
  commentId: string,
): Promise<
  { ok: true; commentId: string; liked: boolean; likesCount: number } | { ok: false; error: string }
> {
  const res = await fetch(`/api/comments/${commentId}/like`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson<
    ApiSuccess<{ commentId: string; liked: boolean; likesCount: number }>
  >(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true, ...data };
}

/** GET /api/comments/paper/:paperId — public threaded list */
export async function fetchCommentsForPaper(
  paperId: string,
): Promise<{ comments: CommentResponse[]; viewerId: string | null }> {
  const res = await fetch(`/api/comments/paper/${paperId}`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ comments: CommentResponse[]; viewerId?: string | null }>>(
    res,
  );
  if (!data.success) return { comments: [], viewerId: null };
  return { comments: data.comments, viewerId: data.viewerId ?? null };
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
