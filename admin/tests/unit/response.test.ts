import { describe, expect, it } from "vitest";
import { ok, err } from "@/lib/response";

describe("admin response envelope", () => {
  it("ok and err match frontend contract", async () => {
    const success = await ok({ ok: true }).json();
    expect(success).toEqual({ success: true, data: { ok: true } });
    const failure = await err("Nope", 403).json();
    expect(failure).toEqual({ success: false, error: "Nope" });
  });
});
