import { describe, expect, it } from "vitest";
import { GET as papersGet } from "@/app/api/papers/route";
import { hasTestDatabase } from "../helpers/db";
import { jsonRequest } from "../helpers/http";

const describeIfDb = hasTestDatabase() ? describe : describe.skip;

describeIfDb("papers API integration", () => {
  it("GET /api/papers returns posts array", async () => {
    const res = await papersGet(jsonRequest("/api/papers"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: unknown[]; total: number };
    expect(Array.isArray(body.posts)).toBe(true);
    expect(typeof body.total).toBe("number");
  });
});
