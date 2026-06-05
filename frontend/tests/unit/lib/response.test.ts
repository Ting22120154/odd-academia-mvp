import { describe, expect, it } from "vitest";
import { ok, err } from "@/lib/response";

describe("response envelope", () => {
  it("ok wraps data", async () => {
    const res = ok({ id: "1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: "1" } });
  });

  it("err wraps message", async () => {
    const res = err("Bad request", 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: "Bad request" });
  });
});
