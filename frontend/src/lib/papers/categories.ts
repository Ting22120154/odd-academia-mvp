/** Fixed category list used across the app (home filter, submit form, paper mapping). */
export const PAPER_CATEGORIES = [
  "AI",
  "Biohacking",
  "Business",
  "Design",
  "Education",
  "Engineering/Robotics",
  "Fashion",
  "Gastronomy",
  "Health",
  "History",
  "Lifestyle/Culture",
  "Maths",
  "Music",
  "Nature",
  "Politics",
  "Pop Culture",
  "Sports",
  "Technology",
] as const;

export type PaperCategory = (typeof PAPER_CATEGORIES)[number];

/** @deprecated Use PAPER_CATEGORIES */
export const BROWSE_CATEGORIES = PAPER_CATEGORIES;

/** @deprecated Use PaperCategory */
export type BrowseCategory = PaperCategory;

/** Maps legacy / alternate labels to a canonical app category. */
const CATEGORY_ALIASES: Record<string, PaperCategory> = {
  ai: "AI",
  "artificial intelligence": "AI",
  "ai infrastructure": "AI",
  "ai infrastructure.": "AI",
  biohacking: "Biohacking",
  business: "Business",
  design: "Design",
  education: "Education",
  "engineering/robotics": "Engineering/Robotics",
  engineering: "Engineering/Robotics",
  robotics: "Engineering/Robotics",
  fashion: "Fashion",
  gastronomy: "Gastronomy",
  food: "Gastronomy",
  health: "Health",
  history: "History",
  "lifestyle/culture": "Lifestyle/Culture",
  lifestyle: "Lifestyle/Culture",
  culture: "Lifestyle/Culture",
  maths: "Maths",
  math: "Maths",
  mathematics: "Maths",
  music: "Music",
  nature: "Nature",
  sustainability: "Nature",
  "sustainable energy": "Nature",
  "sustainable energy practices": "Nature",
  environment: "Nature",
  politics: "Politics",
  "pop culture": "Pop Culture",
  sports: "Sports",
  technology: "Technology",
  "computer science": "Technology",
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeCategory(value: string): PaperCategory | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const key = normalizeKey(trimmed);
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];

  for (const cat of PAPER_CATEGORIES) {
    if (normalizeKey(cat) === key) return cat;
  }

  return null;
}

/** All raw category strings in the DB that should match a canonical category. */
export function getCategoryDbAliases(canonical: PaperCategory): string[] {
  const out = new Set<string>([canonical]);
  for (const [alias, target] of Object.entries(CATEGORY_ALIASES)) {
    if (target === canonical) {
      out.add(alias);
      out.add(
        alias.replace(/\b\w/g, (c) => c.toUpperCase()),
      );
    }
  }
  return [...out];
}

/** Canonical categories assigned to a paper (from DB categories + keywords). */
export function getPaperBrowseCategories(
  categories: string[] = [],
  keywords: string[] = [],
): PaperCategory[] {
  const found = new Set<PaperCategory>();
  for (const value of [...categories, ...keywords]) {
    const normalized = normalizeCategory(value);
    if (normalized) found.add(normalized);
  }
  return [...found];
}

export type CategoryFilterMode = "OR" | "AND";

/** Client-side filter for homepage category multi-select. */
export function paperMatchesCategoryFilter(
  paperCategories: string[] | undefined,
  paperTags: string[] | undefined,
  selected: PaperCategory[],
  mode: CategoryFilterMode,
): boolean {
  if (selected.length === 0) return true;

  const assigned = getPaperBrowseCategories(
    paperCategories ?? [],
    paperTags ?? [],
  );
  const assignedSet = new Set(assigned);

  if (mode === "OR") {
    return selected.some((cat) => assignedSet.has(cat));
  }
  return selected.every((cat) => assignedSet.has(cat));
}

/** When saving a paper: store canonical names on categories, topical terms on keywords. */
export function splitKeywordsAndCategories(values: string[]): {
  categories: string[];
  keywords: string[];
} {
  const categories = new Set<string>();
  const keywords: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalized = normalizeCategory(trimmed);
    if (normalized) categories.add(normalized);
    else keywords.push(trimmed);
  }

  return { categories: [...categories], keywords };
}
