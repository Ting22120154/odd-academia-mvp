import { describe, expect, it } from "vitest";
import { formatCount, socialHref } from "@/lib/profile-client";

describe("profile-client helpers", () => {
  it("formatCount abbreviates thousands", () => {
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1000)).toBe("1k");
    expect(formatCount(1500)).toBe("1.5k");
    expect(formatCount(2000)).toBe("2k");
  });

  it("socialHref builds github and linkedin URLs", () => {
    expect(socialHref("https://github.com/me", "github")).toBe("https://github.com/me");
    expect(socialHref("myhandle", "github")).toBe("https://github.com/myhandle");
    expect(socialHref("@me", "linkedin")).toBe("https://linkedin.com/in/me");
    expect(socialHref(undefined, "github")).toBeNull();
  });
});
