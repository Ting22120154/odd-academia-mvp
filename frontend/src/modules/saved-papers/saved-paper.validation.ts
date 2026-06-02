const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Route param for paper id (save status / save / unsave). */
export function parsePaperIdParam(paperId: string): ParseResult<string> {
  if (!UUID_RE.test(paperId)) {
    return { ok: false, error: "paperId must be a valid UUID" };
  }
  return { ok: true, data: paperId };
}
