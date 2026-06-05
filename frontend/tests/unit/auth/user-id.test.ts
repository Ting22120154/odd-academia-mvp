import { describe, expect, it } from "vitest";
import { isValidUserId } from "@/lib/auth/user-id";

describe("isValidUserId", () => {
  it("accepts valid UUID v4", () => {
    expect(isValidUserId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects invalid ids", () => {
    expect(isValidUserId("1")).toBe(false);
    expect(isValidUserId("not-a-uuid")).toBe(false);
    expect(isValidUserId("")).toBe(false);
  });
});
