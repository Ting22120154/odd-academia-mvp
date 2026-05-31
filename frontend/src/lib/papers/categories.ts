/** Fixed category list used across the app (home filter, submit form, paper mapping). */
export const PAPER_CATEGORIES = [
  "AI",
  "Architecture",
  "Arts",
  "Biohacking",
  "Biology",
  "Business",
  "Chemistry",
  "Data Science",
  "Design",
  "Economics",
  "Education",
  "Engineering/Robotics",
  "Fashion",
  "Gastronomy",
  "Health",
  "History",
  "Law",
  "Lifestyle/Culture",
  "Maths",
  "Music",
  "Nature",
  "Philosophy",
  "Physics",
  "Politics",
  "Pop Culture",
  "Psychology",
  "Science",
  "Sociology",
  "Sports",
  "Technology",
] as const;

export type PaperCategory = (typeof PAPER_CATEGORIES)[number];

/** Visual styling per category for paper cards and filters. */
export const CATEGORY_STYLES: Record<
  PaperCategory,
  { accent: string; headerBg: string }
> = {
  AI: { accent: "#0661ff", headerBg: "#eef4ff" },
  Architecture: { accent: "#64748b", headerBg: "#f1f5f9" },
  Arts: { accent: "#db2777", headerBg: "#fdf2f8" },
  Biohacking: { accent: "#059669", headerBg: "#ecfdf5" },
  Biology: { accent: "#16a34a", headerBg: "#f0fdf4" },
  Business: { accent: "#2563eb", headerBg: "#eff6ff" },
  Chemistry: { accent: "#7c3aed", headerBg: "#f5f3ff" },
  "Data Science": { accent: "#0284c7", headerBg: "#e0f2fe" },
  Design: { accent: "#c026d3", headerBg: "#fdf4ff" },
  Economics: { accent: "#0d9488", headerBg: "#f0fdfa" },
  Education: { accent: "#ea580c", headerBg: "#fff7ed" },
  "Engineering/Robotics": { accent: "#475569", headerBg: "#f8fafc" },
  Fashion: { accent: "#e11d48", headerBg: "#fff1f2" },
  Gastronomy: { accent: "#d97706", headerBg: "#fffbeb" },
  Health: { accent: "#dc2626", headerBg: "#fef2f2" },
  History: { accent: "#92400e", headerBg: "#fef3c7" },
  Law: { accent: "#1e293b", headerBg: "#f8fafc" },
  "Lifestyle/Culture": { accent: "#9333ea", headerBg: "#faf5ff" },
  Maths: { accent: "#0369a1", headerBg: "#e0f2fe" },
  Music: { accent: "#4f46e5", headerBg: "#eef2ff" },
  Nature: { accent: "#15803d", headerBg: "#f0fdf4" },
  Philosophy: { accent: "#6b7280", headerBg: "#f9fafb" },
  Physics: { accent: "#0891b2", headerBg: "#ecfeff" },
  Politics: { accent: "#b91c1c", headerBg: "#fef2f2" },
  "Pop Culture": { accent: "#f59e0b", headerBg: "#fffbeb" },
  Psychology: { accent: "#a855f7", headerBg: "#faf5ff" },
  Science: { accent: "#0ea5e9", headerBg: "#f0f9ff" },
  Sociology: { accent: "#78716c", headerBg: "#fafaf9" },
  Sports: { accent: "#65a30d", headerBg: "#f7fee7" },
  Technology: { accent: "#0066ff", headerBg: "#eef4ff" },
};

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
  "machine learning": "AI",
  "data science": "Data Science",
  analytics: "Data Science",
  architecture: "Architecture",
  arts: "Arts",
  art: "Arts",
  humanities: "Arts",
  biohacking: "Biohacking",
  biology: "Biology",
  "life sciences": "Biology",
  business: "Business",
  finance: "Economics",
  economics: "Economics",
  chemistry: "Chemistry",
  design: "Design",
  education: "Education",
  "engineering/robotics": "Engineering/Robotics",
  engineering: "Engineering/Robotics",
  robotics: "Engineering/Robotics",
  fashion: "Fashion",
  gastronomy: "Gastronomy",
  food: "Gastronomy",
  health: "Health",
  medicine: "Health",
  history: "History",
  law: "Law",
  legal: "Law",
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
  philosophy: "Philosophy",
  physics: "Physics",
  politics: "Politics",
  "pop culture": "Pop Culture",
  psychology: "Psychology",
  science: "Science",
  sociology: "Sociology",
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

/** Primary category for card header icon (first match from paper data). */
export function getPrimaryPaperCategory(
  categories: string[] = [],
  keywords: string[] = [],
  subject?: string,
): PaperCategory | null {
  const fromPaper = getPaperBrowseCategories(categories, keywords);
  if (fromPaper.length > 0) return fromPaper[0];
  if (subject) return normalizeCategory(subject);
  return null;
}

export function getCategoryStyle(category: PaperCategory) {
  return CATEGORY_STYLES[category];
}

/** All raw category strings in the DB that should match a canonical category. */
export function getCategoryDbAliases(canonical: PaperCategory): string[] {
  const out = new Set<string>([canonical]);
  for (const [alias, target] of Object.entries(CATEGORY_ALIASES)) {
    if (target === canonical) {
      out.add(alias);
      out.add(alias.replace(/\b\w/g, (c) => c.toUpperCase()));
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
