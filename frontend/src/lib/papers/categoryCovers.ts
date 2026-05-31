import type { PaperCategory } from "@/lib/papers/categories";

/** Bundled covers — no external CDN (reliable offline + presentation).
 *  JPEGs live in public/paper-covers/; see download-covers.ps1 to refresh. */
const BASE = "/paper-covers";

export const PAPER_COVER_FALLBACK = `${BASE}/fallback.svg`;

/**
 * What each cover JPEG is supposed to show (see also `frontend/scripts/download-covers.ps1`).
 * Card picks one file per category based on paper id hash.
 */
export const CATEGORY_COVER_CATALOG: Record<
  PaperCategory | "default",
  { files: string[]; theme: string }
> = {
  AI: {
    files: ["ai-1.jpg", "ai-2.jpg"],
    theme: "AI chip / circuit visualization; humanoid robot",
  },
  Architecture: {
    files: ["architecture-1.jpg", "architecture-2.jpg"],
    theme: "Modern glass building; architectural structure detail",
  },
  Arts: {
    files: ["arts-1.jpg", "arts-2.jpg"],
    theme: "Paintbrushes and palette; gallery / artwork",
  },
  Biohacking: {
    files: ["biohacking-1.jpg", "biohacking-2.jpg"],
    theme: "Fitness wearable / body metrics; lab health tech",
  },
  Biology: {
    files: ["biology-1.jpg", "biology-2.jpg"],
    theme: "Microscope / cellular; biology lab research",
  },
  Business: {
    files: ["business-1.jpg", "business-2.jpg"],
    theme: "Office desk with charts; team business meeting",
  },
  Chemistry: {
    files: ["chemistry-1.jpg", "chemistry-2.jpg"],
    theme: "Lab glassware and liquids; molecular / chemistry lab",
  },
  "Data Science": {
    files: ["data-science-1.jpg", "data-science-2.jpg"],
    theme: "Analytics dashboard; laptop with data charts",
  },
  Design: {
    files: ["design-1.jpg", "design-2.jpg"],
    theme: "Design workspace; UI / creative tools",
  },
  Economics: {
    files: ["economics-1.jpg", "economics-2.jpg"],
    theme: "Stock market charts; finance graphs",
  },
  Education: {
    files: ["education-1.jpg", "education-2.jpg"],
    theme: "Graduation / campus; classroom learning",
  },
  "Engineering/Robotics": {
    files: ["engineering-1.jpg", "engineering-2.jpg"],
    theme: "Humanoid robot; robotics hardware / workshop",
  },
  Fashion: {
    files: ["fashion-1.jpg", "fashion-2.jpg"],
    theme: "Clothing rack / boutique; fashion photography",
  },
  Gastronomy: {
    files: ["gastronomy-1.jpg", "gastronomy-2.jpg"],
    theme: "Fine dining plate; chef food preparation",
  },
  Health: {
    files: ["health-1.jpg", "health-2.jpg"],
    theme: "Medical stethoscope / care; healthcare setting",
  },
  History: {
    files: ["history-1.jpg", "history-2.jpg"],
    theme: "Antique books / archive; vintage historical scene",
  },
  Law: {
    files: ["law-1.jpg", "law-2.jpg"],
    theme: "Courthouse columns; legal documents / gavel",
  },
  "Lifestyle/Culture": {
    files: ["lifestyle-1.jpg", "lifestyle-2.jpg"],
    theme: "Friends outdoors; group social gathering",
  },
  Maths: {
    files: ["maths-1.jpg", "maths-2.jpg"],
    theme: "Chalkboard equations; handwritten math formulas",
  },
  Music: {
    files: ["music-1.jpg", "music-2.jpg"],
    theme: "Recording studio; live concert / performance",
  },
  Nature: {
    files: ["nature-1.jpg", "nature-2.jpg", "nature-3.jpg"],
    theme: "Lake and mountains; green valley landscape; mountain vista",
  },
  Philosophy: {
    files: ["philosophy-1.jpg", "philosophy-2.jpg"],
    theme: "Stack of books; reading / contemplative portrait",
  },
  Physics: {
    files: ["physics-1.jpg", "physics-2.jpg"],
    theme: "Particle / cosmic imagery; physics lab equipment",
  },
  Politics: {
    files: ["politics-1.jpg", "politics-2.jpg"],
    theme: "Parliament / government building; political assembly",
  },
  "Pop Culture": {
    files: ["pop-culture-1.jpg", "pop-culture-2.jpg"],
    theme: "Concert crowd; live music event",
  },
  Psychology: {
    files: ["psychology-1.jpg", "psychology-2.jpg"],
    theme: "Therapy / mental health; thoughtful portrait",
  },
  Science: {
    files: ["science-1.jpg", "science-2.jpg"],
    theme: "General science lab; research equipment",
  },
  Sociology: {
    files: ["sociology-1.jpg", "sociology-2.jpg"],
    theme: "Diverse group discussion; community meetup",
  },
  Sports: {
    files: ["sports-1.jpg", "sports-2.jpg"],
    theme: "Stadium athletics; running / fitness",
  },
  Technology: {
    files: ["technology-1.jpg", "technology-2.jpg"],
    theme: "Laptop with code on desk; laptop screen showing source code",
  },
  default: {
    files: ["default-1.jpg", "default-2.jpg"],
    theme: "Library bookshelves; study desk with books",
  },
};

const CATEGORY_COVER_FILES: Record<PaperCategory, string[]> = {
  AI: CATEGORY_COVER_CATALOG.AI.files,
  Architecture: CATEGORY_COVER_CATALOG.Architecture.files,
  Arts: CATEGORY_COVER_CATALOG.Arts.files,
  Biohacking: CATEGORY_COVER_CATALOG.Biohacking.files,
  Biology: CATEGORY_COVER_CATALOG.Biology.files,
  Business: CATEGORY_COVER_CATALOG.Business.files,
  Chemistry: CATEGORY_COVER_CATALOG.Chemistry.files,
  "Data Science": CATEGORY_COVER_CATALOG["Data Science"].files,
  Design: CATEGORY_COVER_CATALOG.Design.files,
  Economics: CATEGORY_COVER_CATALOG.Economics.files,
  Education: CATEGORY_COVER_CATALOG.Education.files,
  "Engineering/Robotics": CATEGORY_COVER_CATALOG["Engineering/Robotics"].files,
  Fashion: CATEGORY_COVER_CATALOG.Fashion.files,
  Gastronomy: CATEGORY_COVER_CATALOG.Gastronomy.files,
  Health: CATEGORY_COVER_CATALOG.Health.files,
  History: CATEGORY_COVER_CATALOG.History.files,
  Law: CATEGORY_COVER_CATALOG.Law.files,
  "Lifestyle/Culture": CATEGORY_COVER_CATALOG["Lifestyle/Culture"].files,
  Maths: CATEGORY_COVER_CATALOG.Maths.files,
  Music: CATEGORY_COVER_CATALOG.Music.files,
  Nature: CATEGORY_COVER_CATALOG.Nature.files,
  Philosophy: CATEGORY_COVER_CATALOG.Philosophy.files,
  Physics: CATEGORY_COVER_CATALOG.Physics.files,
  Politics: CATEGORY_COVER_CATALOG.Politics.files,
  "Pop Culture": CATEGORY_COVER_CATALOG["Pop Culture"].files,
  Psychology: CATEGORY_COVER_CATALOG.Psychology.files,
  Science: CATEGORY_COVER_CATALOG.Science.files,
  Sociology: CATEGORY_COVER_CATALOG.Sociology.files,
  Sports: CATEGORY_COVER_CATALOG.Sports.files,
  Technology: CATEGORY_COVER_CATALOG.Technology.files,
};

const DEFAULT_FILES = CATEGORY_COVER_CATALOG.default.files;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

function filesForCategory(category: PaperCategory | null): string[] {
  if (!category) return DEFAULT_FILES;
  return CATEGORY_COVER_FILES[category] ?? DEFAULT_FILES;
}

/** Primary cover path for a paper card. */
export function getPaperCoverUrl(
  category: PaperCategory | null,
  paperId: string,
): string {
  const files = filesForCategory(category);
  return `${BASE}/${files[hashId(paperId) % files.length]}`;
}

/** Alternate paths to try if the primary JPEG is missing. */
export function getPaperCoverFallbacks(
  category: PaperCategory | null,
  paperId: string,
): string[] {
  const files = filesForCategory(category);
  const start = hashId(paperId) % files.length;
  const rotated = [...files.slice(start), ...files.slice(0, start)];
  return [...rotated.map((f) => `${BASE}/${f}`), PAPER_COVER_FALLBACK];
}
