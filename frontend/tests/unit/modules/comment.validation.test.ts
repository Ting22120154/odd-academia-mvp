import { describe, expect, it } from "vitest";
import {
  COMMENT_CONTENT_MAX,
  parseCommentIdParam,
  parseCreateCommentBody,
  parsePaperIdParam,
  parseUpdateCommentBody,
} from "@/modules/comments/comment.validation";

const PAPER_ID = "550e8400-e29b-41d4-a716-446655440000";
const COMMENT_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("comment.validation", () => {
  it("parses valid create body", () => {
    const result = parseCreateCommentBody({
      paperId: PAPER_ID,
      content: "  Hello world  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.content).toBe("Hello world");
      expect(result.data.paperId).toBe(PAPER_ID);
    }
  });

  it("rejects empty content", () => {
    const result = parseCreateCommentBody({ paperId: PAPER_ID, content: "   " });
    expect(result).toEqual({ ok: false, error: "content is required" });
  });

  it("rejects content over max length", () => {
    const result = parseCreateCommentBody({
      paperId: PAPER_ID,
      content: "x".repeat(COMMENT_CONTENT_MAX + 1),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid paper UUID", () => {
    const result = parseCreateCommentBody({ paperId: "bad", content: "hi" });
    expect(result.ok).toBe(false);
  });

  it("parses update body", () => {
    const result = parseUpdateCommentBody({ content: "Updated" });
    expect(result.ok).toBe(true);
  });

  it("validates route params", () => {
    expect(parsePaperIdParam(PAPER_ID).ok).toBe(true);
    expect(parseCommentIdParam(COMMENT_ID).ok).toBe(true);
    expect(parsePaperIdParam("nope").ok).toBe(false);
  });
});
