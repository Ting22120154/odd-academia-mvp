/** Category options — shared with onboarding and profile edit. */
export const INTEREST_OPTIONS = [
  { label: "AI", emoji: "🤖" },
  { label: "Biohacking", emoji: "🧬" },
  { label: "Business", emoji: "💼" },
  { label: "Design", emoji: "🎨" },
  { label: "Education", emoji: "📚" },
  { label: "Engineering", emoji: "⚙️" },
  { label: "Fashion", emoji: "👗" },
  { label: "Gastronomy", emoji: "🍽️" },
  { label: "Health", emoji: "❤️" },
  { label: "History", emoji: "🏛️" },
  { label: "Lifestyle", emoji: "🌿" },
  { label: "Maths", emoji: "📐" },
  { label: "Music", emoji: "🎵" },
  { label: "Nature", emoji: "🌍" },
  { label: "Politics", emoji: "🗳️" },
  { label: "Pop Culture", emoji: "🎬" },
  { label: "Sports", emoji: "⚽" },
  { label: "Technology", emoji: "💻" },
] as const;

export type InterestLabel = (typeof INTEREST_OPTIONS)[number]["label"];
