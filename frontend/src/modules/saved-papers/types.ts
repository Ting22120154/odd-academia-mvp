/** API contract for saved papers (Person 3 — Phase 2). */

export type SavedPaperAuthor = {
  id: string;
  fullName: string;
  avatarUrl?: string;
};

export type SavedPaperResponse = {
  paperId: string;
  /** Mock UI route id (`1`, `2`, …) when paper matches seed order. */
  routeId?: string;
  title: string;
  abstract?: string;
  author: SavedPaperAuthor;
  savedAt: string;
};

export type SaveStatusResponse = {
  paperId: string;
  saved: boolean;
};
