/**
 * Browser-side helpers for profile APIs (credentials: "include" sends cookies).
 * Types mirror server ProfileUser; keep in sync with lib/auth/profile.ts.
 */

export type ProfileUser = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  education?: string;
  jobTitle?: string;
  workStatus: string;
  profileVisibility: "PUBLIC" | "PRIVATE";
  github?: string;
  linkedin?: string;
  interests: string[];
  email?: string;
  stats: {
    papers: number;
    followers: number;
    following: number;
    citedComments: number;
    savedPapers: number;
  };
  papers: { id: string; title: string; description: string; tags: string[] }[];
  isOwnProfile: boolean;
};

type ApiRes<T> = { success: true; data: T } | { success: false; error: string };

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function socialHref(value: string | undefined, kind: "github" | "linkedin"): string | null {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  if (kind === "github") return `https://github.com/${value.replace(/^\//, "")}`;
  return `https://linkedin.com/in/${value.replace(/^@/, "")}`;
}

export async function fetchMyProfile(): Promise<{ user?: ProfileUser; error?: string }> {
  const res = await fetch("/api/users/me", { credentials: "include" });
  const json = (await res.json()) as ApiRes<{ user: ProfileUser }>;
  if (!json.success) return { error: json.error };
  return { user: json.data.user };
}

export async function fetchUserProfile(
  id: string
): Promise<{ user?: ProfileUser; isFollowing?: boolean; error?: string }> {
  const res = await fetch(`/api/users/${id}`, { credentials: "include" });
  const json = (await res.json()) as ApiRes<{ user: ProfileUser; isFollowing: boolean }>;
  if (!json.success) return { error: json.error };
  return { user: json.data.user, isFollowing: json.data.isFollowing };
}

export async function updateMyProfile(
  body: Record<string, unknown>
): Promise<{ user?: ProfileUser; error?: string }> {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiRes<{ user: ProfileUser }>;
  if (!json.success) return { error: json.error };
  return { user: json.data.user };
}
