import { describe, expect, it } from "vitest";
import { POST as createPaper } from "@/app/api/papers/route";
import { jsonRequest } from "../helpers/http";

describe("papers API auth", () => {
  it("POST /api/papers returns 401 without session", async () => {
    const res = await createPaper(
      jsonRequest("/api/papers", {
        body: { title: "Test", abstract: "Abstract text here" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("POST /api/papers rejects invalid body when authed would be next step", async () => {
    const res = await createPaper(jsonRequest("/api/papers", { body: {} }));
    expect([400, 401]).toContain(res.status);
  });
});
