/**
 * Profile DTOs and mappers (server-side).
 * - Maps Prisma workStatus enum ↔ UI labels
 * - Maps profileVisibility boolean ↔ PUBLIC | PRIVATE
 * - Stats use Prisma _count (followers, following, papers, comments)
 */
import type { Paper, User, WorkStatus } from "@prisma/client";
import { toApiRole } from "@/lib/auth/user";

export type ProfileVisibility = "PUBLIC" | "PRIVATE";

export type ProfilePaper = {
  id: string;
  title: string;
  description: string;
  tags: string[];
};

export type ProfileStats = {
  papers: number;
  followers: number;
  following: number;
  citedComments: number;
  savedPapers: number;
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
    comments: number;
  };
};

const WORK_STATUS_UI: Record<WorkStatus, string> = {
  open: "Open for Work",
  not_open: "Not Looking",
  freelance: "Freelancing",
  none: "None",
};

const WORK_STATUS_DB: Record<string, WorkStatus> = {
  "Open for Work": "open",
  "Not Looking": "not_open",
  Freelancing: "freelance",
  Student: "none",
  None: "none",
};

export function workStatusToUi(status: WorkStatus): string {
  return WORK_STATUS_UI[status] ?? "None";
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

export function toProfilePaper(paper: Paper & { keywords: { keyword: string }[] }): ProfilePaper {
  return {
    id: paper.id,
    title: paper.title,
    description: paper.abstract ?? "",
    tags: paper.keywords.map((k) => k.keyword),
  };
}

export function toProfileUser(
  user: UserWithRelations,
  papers: ProfilePaper[],
  options: { viewerId?: string; includeEmail?: boolean }
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
      papers: user._count.papers,
      followers: user._count.followers,
      following: user._count.following,
      citedComments: user._count.comments,
      savedPapers: 0, // Not in schema yet — omitted from profile UI
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
      comments: true,
    },
  },
} as const;
