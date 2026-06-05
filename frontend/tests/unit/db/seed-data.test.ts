import { describe, expect, it } from "vitest";
import { interests } from "../../../../packages/db/src/data";
import { PAPER_CATEGORIES } from "@/lib/papers/categories";

describe("seed interests vs PAPER_CATEGORIES", () => {
  it("has the same interest names as frontend categories", () => {
    const seedNames = interests.map((i) => i.name).sort();
    const categoryNames = [...PAPER_CATEGORIES].sort();
    expect(seedNames).toEqual(categoryNames);
  });
});
