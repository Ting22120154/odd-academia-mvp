import { describe, expect, it } from "vitest";
import { normalizeProfileInterests } from "@/lib/interests";

describe("normalizeProfileInterests", () => {
  it("maps aliases to canonical categories and dedupes", () => {
    expect(
      normalizeProfileInterests([
        "Engineering",
        "Engineering/Robotics",
        "AI",
        "ai",
      ]),
    ).toEqual(["Engineering/Robotics", "AI"]);
  });

  it("drops unknown labels", () => {
    expect(normalizeProfileInterests(["Not A Real Category", "Education"])).toEqual([
      "Education",
    ]);
  });
});
