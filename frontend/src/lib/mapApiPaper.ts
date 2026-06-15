import type { MockPost } from "@/lib/mockPosts";
import { getPaperBrowseCategories } from "@/lib/papers/categories";
import { mapDbContributors } from "@/lib/papers/contributors";
import { ABSTRACT_SUMMARY_MAX_WORDS, truncateToMaxWords } from "@/lib/papers/abstract";

export type ApiPaperAuthor = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
};

export type ApiPaper = {
  id: string;
  title: string;
  abstract?: string | null;
  fileUrl?: string | null;
  publishedAt?: string | null;
  citationCount?: number | null;
  viewCount?: number | null;
  author?: ApiPaperAuthor | null;
  keywords?: { keyword: string }[];
  categories?: { category: string }[];
  contributors?: {
    contributorName: string;
    contributorUserId?: string | null;
    user?: {
      id: string;
      fullName: string;
      username: string;
      avatarUrl?: string | null;
    } | null;
  }[];
  references?: { id: string; citationText: string | null }[];
};

function inferFileType(fileUrl?: string | null): MockPost["fileType"] {
  if (!fileUrl) return "unknown";
  const lower = fileUrl.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  return "unknown";
}

export function mapApiPaperToViewerPost(paper: ApiPaper): MockPost {
  const rawCategories = paper.categories?.map((c) => c.category).filter(Boolean) ?? [];
  const rawKeywords = paper.keywords?.map((k) => k.keyword).filter(Boolean) ?? [];
  const browseCategories = getPaperBrowseCategories(rawCategories, rawKeywords);
  const subject = browseCategories[0] ?? rawCategories[0] ?? rawKeywords[0] ?? "Research";
  const tags =
    browseCategories.length > 0
      ? browseCategories
      : rawCategories.length > 0
        ? rawCategories.slice(0, 3)
        : rawKeywords.slice(0, 3);
  const abstract = paper.abstract?.trim() ?? "";

  return {
    id: paper.id,
    title: paper.title,
    abstract: abstract || undefined,
    summary: truncateToMaxWords(abstract, ABSTRACT_SUMMARY_MAX_WORDS),
    authorId: paper.author?.id,
    authorName: paper.author?.fullName ?? "Unknown",
    authorAvatarUrl: paper.author?.avatarUrl ?? "/avatars/profile.svg",
    authorBio: paper.author?.bio ?? undefined,
    authorJobTitle: paper.author?.jobTitle ?? undefined,
    contributors: mapDbContributors(paper.contributors ?? []),
    subject,
    categories: browseCategories,
    tags,
    fileUrl: paper.fileUrl ?? "",
    fileType: inferFileType(paper.fileUrl),
    publishedAt: paper.publishedAt ?? undefined,
    citationCount: paper.citationCount ?? 0,
    viewCount: paper.viewCount ?? 0,
    references:
      paper.references
        ?.map((r) => ({
          id: r.id,
          citationText: r.citationText?.trim() ?? "",
        }))
        .filter((r) => r.citationText) ?? [],
  };
}
