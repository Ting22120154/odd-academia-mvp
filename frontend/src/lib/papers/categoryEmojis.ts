import { PAPER_CATEGORIES, type PaperCategory } from "@/lib/papers/categories";

/** Emoji per canonical category — keep in sync with packages/db/src/data.ts `interests`. */
export const CATEGORY_EMOJIS: Record<PaperCategory, string> = {
  AI: "🤖",
  Architecture: "🏛️",
  Arts: "🎭",
  Biohacking: "🧬",
  Biology: "🔬",
  Business: "💼",
  Chemistry: "⚗️",
  "Data Science": "📊",
  Design: "🎨",
  Economics: "📈",
  Education: "🎓",
  "Engineering/Robotics": "⚙️",
  Fashion: "👗",
  Gastronomy: "🍳",
  Health: "🏥",
  History: "📜",
  Law: "⚖️",
  "Lifestyle/Culture": "🌐",
  Maths: "➗",
  Music: "🎵",
  Nature: "🌿",
  Philosophy: "📖",
  Physics: "⚛️",
  Politics: "🗳️",
  "Pop Culture": "🎬",
  Psychology: "🧠",
  Science: "🔭",
  Sociology: "👥",
  Sports: "⚽",
  Technology: "💻",
};

export function getCategoryEmoji(category: PaperCategory): string {
  return CATEGORY_EMOJIS[category];
}

/** Onboarding / profile interest picker options (same order as PAPER_CATEGORIES). */
export const ONBOARDING_INTEREST_OPTIONS = PAPER_CATEGORIES.map((label) => ({
  label,
  emoji: CATEGORY_EMOJIS[label],
}));
