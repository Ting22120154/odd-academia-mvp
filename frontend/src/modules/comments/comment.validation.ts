import type { CreateCommentRequest, UpdateCommentRequest } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const COMMENT_CONTENT_MAX = 10_000;

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseContent(value: unknown): ParseResult<string> {
  if (typeof value !== "string") return { ok: false, error: "content must be a string" };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: "content is required" };
  if (trimmed.length > COMMENT_CONTENT_MAX) {
    return { ok: false, error: `content must be at most ${COMMENT_CONTENT_MAX} characters` };
  }
  return { ok: true, data: trimmed };
}

function parseUuid(value: unknown, field: string): ParseResult<string> {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    return { ok: false, error: `${field} must be a valid UUID` };
  }
  return { ok: true, data: value };
}

/** POST /api/comments body */
export function parseCreateCommentBody(body: unknown): ParseResult<CreateCommentRequest> {
  if (!isRecord(body)) return { ok: false, error: "Invalid JSON body" };

  const paperId = parseUuid(body.paperId, "paperId");
  if (!paperId.ok) return paperId;

  const content = parseContent(body.content);
  if (!content.ok) return content;

  let parentCommentId: string | undefined;
  if (body.parentCommentId !== undefined && body.parentCommentId !== null) {
    const parent = parseUuid(body.parentCommentId, "parentCommentId");
    if (!parent.ok) return parent;
    parentCommentId = parent.data;
  }

  return {
    ok: true,
    data: {
      paperId: paperId.data,
      content: content.data,
      parentCommentId,
    },
  };
}

/** PUT /api/comments/:id body */
export function parseUpdateCommentBody(body: unknown): ParseResult<UpdateCommentRequest> {
  if (!isRecord(body)) return { ok: false, error: "Invalid JSON body" };

  const content = parseContent(body.content);
  if (!content.ok) return content;

  return { ok: true, data: { content: content.data } };
}

/** GET /api/comments/paper/:paperId param */
export function parsePaperIdParam(paperId: string): ParseResult<string> {
  return parseUuid(paperId, "paperId");
}

/** PUT/DELETE /api/comments/:id param */
export function parseCommentIdParam(id: string): ParseResult<string> {
  return parseUuid(id, "comment id");
}
