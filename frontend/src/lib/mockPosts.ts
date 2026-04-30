export type MockPost = {
  id: string;
  title: string;
  summary: string;
  authorName: string;
  /** Primary subject / fallback when `tags` is empty */
  subject: string;
  /** Category pills (Figma shows 1–2 tags per card) */
  tags?: string[];
  /**
   * Public URL to the uploaded file (PDF/Word).
   *
   * MVP note: for now we point to an external dummy PDF so the reader UI works
   * without needing upload/storage implemented yet.
   */
  fileUrl?: string;
  /** File type hint used to decide which viewer to render. */
  fileType?: "pdf" | "docx" | "doc" | "unknown";
  /**
   * Tailwind classes for the gradient strip at the top of the card.
   * Figma uses mesh-like gradients; we approximate with multi-stop gradients.
   */
  headerGradientClass?: string;
};

/**
 * Temporary in-memory data used to unblock UI/routing work before the backend exists.
 *
 * Replace plan:
 * - Swap `mockPosts` + `getMockPostById` with API calls (e.g. `/api/posts` and `/api/posts/:id`)
 * - Keep the `MockPost` shape as a starting point for a shared Post type.
 */
export const mockPosts: MockPost[] = [
  // Note: these entries are curated to match the paper cards shown in Figma.
  {
    id: "1",
    title: "Innovative Approaches in Quantum Computing",
    summary:
      "Exploring novel methods and frameworks that could reshape how we think about computation at scale. This preview truncates with an ellipsis in the UI…",
    authorName: "James B.",
    subject: "Computer science",
    tags: ["AI infrastructure", "Computer science"],
    fileType: "pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    headerGradientClass:
      "bg-gradient-to-br from-orange-300 via-amber-200 to-rose-300",
  },
  {
    id: "2",
    title: "Biohacking for Health Optimisation",
    summary:
      "A short overview of practical interventions and evidence-based tweaks for wellbeing. More detail appears on the paper page…",
    authorName: "Max Z.",
    subject: "Health",
    tags: ["Health", "Biohacking"],
    fileType: "pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    headerGradientClass:
      "bg-gradient-to-br from-sky-400 via-indigo-400 to-fuchsia-400",
  },
  {
    id: "3",
    title: "Effects of Workplace Fashion Choices",
    summary:
      "How appearance and dress norms interact with perception and team dynamics in modern workplaces…",
    authorName: "Jack E.",
    subject: "Pop Culture",
    tags: ["Health", "Pop Culture"],
    fileType: "pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    headerGradientClass:
      "bg-gradient-to-br from-emerald-300 via-teal-200 to-cyan-300",
  },
  {
    id: "4",
    title: "The Angelic Tune",
    summary:
      "A creative exploration of sound, culture, and the stories we attach to music across communities…",
    authorName: "Tina A.",
    subject: "Pop Culture",
    tags: ["Pop Culture", "Biohacking"],
    fileType: "pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    headerGradientClass:
      "bg-gradient-to-br from-pink-300 via-violet-300 to-orange-200",
  },
];

export function getMockPostById(id: string) {
  return mockPosts.find((p) => p.id === id) ?? null;
}
