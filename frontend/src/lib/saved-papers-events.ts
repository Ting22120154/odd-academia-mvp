/** Notify listeners to reload saved-paper lists (profile, /saved-papers, home). */
export function notifySavedPapersChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("odd:saved-papers-changed"));
}
