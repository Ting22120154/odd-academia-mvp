import { describe, expect, it } from "vitest";
import {
  ABSTRACT_MAX_WORDS,
  countWords,
  isAbstractWithinWordLimit,
  trimToMaxWords,
  truncateToMaxWords,
} from "@/lib/papers/abstract";

describe("paper abstract word limits", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  hello   world  ")).toBe(2);
  });

  it("trims to max words", () => {
    const text = "one two three four";
    expect(trimToMaxWords(text, 2)).toBe("one two");
  });

  it("truncates with ellipsis for previews", () => {
    expect(truncateToMaxWords("alpha beta gamma", 2)).toBe("alpha beta…");
  });

  it("enforces 500-word limit", () => {
    const words = Array.from({ length: 501 }, (_, i) => `w${i}`).join(" ");
    expect(isAbstractWithinWordLimit(words)).toBe(false);
    expect(isAbstractWithinWordLimit(trimToMaxWords(words))).toBe(true);
    expect(countWords(trimToMaxWords(words))).toBe(ABSTRACT_MAX_WORDS);
  });
});
