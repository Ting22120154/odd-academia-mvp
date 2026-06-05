import { describe, expect, it } from "vitest";
import { POST as createComment } from "@/app/api/comments/route";
import { jsonRequest } from "../helpers/http";

describe("comments API auth", () => {
  it("POST /api/comments returns 401 without session", async () => {
    const res = await createComment(
      jsonRequest("/api/comments", {
        body: {
          paperId: "550e8400-e29b-41d4-a716-446655440000",
          content: "Hello",
        },
      }),
    );
    expect(res.status).toBe(401);
  });
});
