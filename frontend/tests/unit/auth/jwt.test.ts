import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "@/lib/auth/jwt";

describe("jwt", () => {
  it("signs and verifies a user token", () => {
    const token = signToken({
      sub: "11111111-1111-4111-8111-111111111111",
      email: "user@test.local",
      role: "user",
    });
    const payload = verifyToken(token);
    expect(payload?.sub).toBe("11111111-1111-4111-8111-111111111111");
    expect(payload?.email).toBe("user@test.local");
    expect(payload?.role).toBe("user");
  });

  it("returns null for invalid token", () => {
    expect(verifyToken("not-a-token")).toBeNull();
  });
});
