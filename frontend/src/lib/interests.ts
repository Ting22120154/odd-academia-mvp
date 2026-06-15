/**
 * Profile interest options and normalization — aligned with PAPER_CATEGORIES / onboarding.
 */
import { normalizeCategory, PAPER_CATEGORIES, type PaperCategory } from "@/lib/papers/categories";
import { CATEGORY_EMOJIS, ONBOARDING_INTEREST_OPTIONS } from "@/lib/papers/categoryEmojis";

/** Same list as onboarding InterestPicker and paper categories. */
export const INTEREST_OPTIONS = ONBOARDING_INTEREST_OPTIONS;

export type InterestLabel = PaperCategory;

/** Map legacy / alias labels to canonical category names; dedupe. */
export function normalizeProfileInterests(raw: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of raw) {
    const canonical = normalizeCategory(String(item ?? "").trim());
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }

  return out.slice(0, 30);
}

export function interestIcon(name: string): string {
  const canonical = normalizeCategory(name);
  if (canonical) return CATEGORY_EMOJIS[canonical];
  return "📌";
}

export { PAPER_CATEGORIES };
