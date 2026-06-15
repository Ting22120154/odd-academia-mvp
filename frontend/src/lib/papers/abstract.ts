/** Max words for paper abstract (upload / API). */
export const ABSTRACT_MAX_WORDS = 500;

/** Words shown in card/list previews before truncation. */
export const ABSTRACT_SUMMARY_MAX_WORDS = 80;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function trimToMaxWords(text: string, maxWords = ABSTRACT_MAX_WORDS): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

export function truncateToMaxWords(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function isAbstractWithinWordLimit(
  text: string,
  maxWords = ABSTRACT_MAX_WORDS,
): boolean {
  return countWords(text) <= maxWords;
}
