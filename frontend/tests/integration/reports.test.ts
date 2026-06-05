import { describe, expect, it } from "vitest";
import { POST as createReport } from "@/app/api/reports/route";
import { jsonRequest } from "../helpers/http";

describe("reports API", () => {
  it("POST /api/reports returns 401 without session", async () => {
    const res = await createReport(
      jsonRequest("/api/reports", {
        body: {
          type: "user",
          reportedId: "550e8400-e29b-41d4-a716-446655440000",
          subject: "Spam",
          reason: "Testing",
        },
      }),
    );
    expect(res.status).toBe(401);
  });
});
