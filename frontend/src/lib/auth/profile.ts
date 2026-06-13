/**
 * Profile DTOs and mappers (server-side).
 * - Maps Prisma workStatus enum ↔ UI labels
 * - Maps profileVisibility boolean ↔ PUBLIC | PRIVATE
 * - Stats: followers/following via _count; engagement metrics via profile-metrics
 */
import type { Paper, User, WorkStatus } from "@prisma/client";
import { toApiRole } from "@/lib/auth/user";
import type { ProfileMetrics } from "@/lib/auth/profile-metrics";
import { getPaperBrowseCategories } from "@/lib/papers/categories";

export type ProfileVisibility = "PUBLIC" | "PRIVATE";

export type ProfilePaper = {
  id: string;
  title: string;
  description: string;
  /** Canonical categories from DB (for cover image). */
  categories: string[];
  /** Display tags on cards (categories + keywords, deduped). */
  tags: string[];
};

export type ProfileStats = {
  /** Published papers by this author */
  papers: number;
  /** People following this user profile */
  followers: number;
  following: number;
  /** Times this user's published papers were viewed */
  paperViews: number;
  /** People following this user's published papers */
  paperFollows: number;
  /** Comments from other users on this user's published papers */
  commentsOnPapers: number;
  /** Published papers this user follows */
  followedPapers: number;
};

export type ProfileUser = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  education?: string;
  jobTitle?: string;
  workStatus: string;
  profileVisibility: ProfileVisibility;
  github?: string;
  linkedin?: string;
  interests: string[];
  role: ReturnType<typeof toApiRole>;
  email?: string;
  stats: ProfileStats;
  papers: ProfilePaper[];
  isOwnProfile: boolean;
};

type UserWithRelations = User & {
  interests: { interest: { name: string } }[];
  _count: {
    papers: number;
    followers: number;
    following: number;
  };
};

const WORK_STATUS_UI: Record<WorkStatus, string> = {
  open: "Employed",
  not_open: "Seeking employment",
  freelance: "Freelancing",
  none: "Undisclosed",
};

const WORK_STATUS_DB: Record<string, WorkStatus> = {
  Employed: "open",
  "Open for Work": "open",
  "Open For Work": "open",
  "Seeking employment": "not_open",
  "Not Looking": "not_open",
  "Not Open For Work": "not_open",
  Freelancing: "freelance",
  Freelance: "freelance",
  Student: "none",
  Undisclosed: "none",
  None: "none",
};

export function workStatusToUi(status: WorkStatus): string {
  return WORK_STATUS_UI[status] ?? "Undisclosed";
}

export function workStatusFromUi(label: string): WorkStatus {
  return WORK_STATUS_DB[label] ?? "none";
}

export function visibilityToUi(publicFlag: boolean): ProfileVisibility {
  return publicFlag ? "PUBLIC" : "PRIVATE";
}

export function visibilityFromUi(label: ProfileVisibility): boolean {
  return label === "PUBLIC";
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function toProfilePaper(
  paper: Paper & {
    keywords: { keyword: string }[];
    categories: { category: string }[];
  },
): ProfilePaper {
  const categoryNames = paper.categories.map((c) => c.category);
  const keywordNames = paper.keywords.map((k) => k.keyword);
  const browseCategories = getPaperBrowseCategories(categoryNames, keywordNames);
  const tags =
    browseCategories.length > 0
      ? [...browseCategories]
      : keywordNames.length > 0
        ? keywordNames.slice(0, 4)
        : categoryNames.slice(0, 4);

  return {
    id: paper.id,
    title: paper.title,
    description: paper.abstract ?? "",
    categories: categoryNames,
    tags: tags.slice(0, 4),
  };
}

/** Map profile paper row to home-page card shape (links to /paper/[id]). */
export function profilePaperToViewerPost(
  paper: ProfilePaper,
  author: { fullName: string; avatarUrl?: string },
): {
  id: string;
  title: string;
  summary: string;
  authorName: string;
  authorAvatarUrl?: string;
  subject: string;
  categories?: string[];
  tags?: string[];
} {
  const subject = paper.categories[0] ?? paper.tags[0] ?? "";
  return {
    id: paper.id,
    title: paper.title,
    summary: paper.description,
    authorName: author.fullName,
    authorAvatarUrl: author.avatarUrl,
    subject,
    categories: paper.categories,
    tags: paper.tags,
  };
}

export function toProfileUser(
  user: UserWithRelations,
  papers: ProfilePaper[],
  options: { viewerId?: string; includeEmail?: boolean; metrics: ProfileMetrics }
): ProfileUser {
  const isOwnProfile = options.viewerId === user.id;
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    avatarUrl: user.avatarUrl ?? undefined,
    bio: user.bio ?? undefined,
    education: user.education ?? undefined,
    jobTitle: user.jobTitle ?? undefined,
    workStatus: workStatusToUi(user.workStatus),
    profileVisibility: visibilityToUi(user.profileVisibility),
    github: user.githubUrl ?? undefined,
    linkedin: user.linkedinUrl ?? undefined,
    interests: user.interests.map((i) => i.interest.name),
    role: toApiRole(user.role),
    email: options.includeEmail ? user.email : undefined,
    stats: {
      papers: options.metrics.papersPublished,
      followers: user._count.followers,
      following: user._count.following,
      paperViews: options.metrics.paperViews,
      paperFollows: options.metrics.paperFollows,
      commentsOnPapers: options.metrics.commentsOnPapers,
      followedPapers: options.metrics.followedPapers,
    },
    papers,
    isOwnProfile,
  };
}

/** Prisma include used by GET /api/users/me and GET /api/users/[id]. */
export const profileInclude = {
  interests: { include: { interest: true } },
  _count: {
    select: {
      papers: true,
      followers: true,
      following: true,
    },
  },
} as const;
