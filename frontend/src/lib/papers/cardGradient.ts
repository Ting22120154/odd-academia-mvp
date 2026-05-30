/** Stable pseudo-random diagonal gradient per paper (varies by id, same on every load). */
export function randomCardGradientStyle(paperId: string): string {
  let hash = 0;
  for (let i = 0; i < paperId.length; i++) {
    hash = (hash * 31 + paperId.charCodeAt(i)) >>> 0;
  }

  const nextHue = () => {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return hash % 360;
  };

  const h1 = nextHue();
  const h2 = nextHue();
  const h3 = nextHue();

  return `linear-gradient(135deg, hsl(${h1} 72% 74%) 0%, hsl(${h2} 68% 68%) 50%, hsl(${h3} 75% 76%) 100%)`;
}
