/**
 * Browser-side helpers for follow APIs.
 * Used by /following and /user/[id] follow button.
 */

export type FollowAuthor = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isFollowing: boolean;
};

type ApiRes<T> = { success: true; data: T } | { success: false; error: string };

export async function fetchFollowingList(): Promise<{ people?: FollowAuthor[]; error?: string }> {
  const res = await fetch("/api/users/me/following", { credentials: "include" });
  const json = (await res.json()) as ApiRes<{ people: FollowAuthor[] }>;
  if (!json.success) return { error: json.error };
  return { people: json.data.people };
}

export async function fetchFollowersList(): Promise<{ people?: FollowAuthor[]; error?: string }> {
  const res = await fetch("/api/users/me/followers", { credentials: "include" });
  const json = (await res.json()) as ApiRes<{ people: FollowAuthor[] }>;
  if (!json.success) return { error: json.error };
  return { people: json.data.people };
}

export async function followUser(id: string): Promise<{ isFollowing?: boolean; error?: string }> {
  const res = await fetch(`/api/users/${id}/follow`, {
    method: "POST",
    credentials: "include",
  });
  const json = (await res.json()) as ApiRes<{ isFollowing: boolean }>;
  if (!json.success) return { error: json.error };
  return { isFollowing: json.data.isFollowing };
}

export async function unfollowUser(id: string): Promise<{ isFollowing?: boolean; error?: string }> {
  const res = await fetch(`/api/users/${id}/follow`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = (await res.json()) as ApiRes<{ isFollowing: boolean }>;
  if (!json.success) return { error: json.error };
  return { isFollowing: json.data.isFollowing };
}

export async function toggleFollow(
  userId: string,
  currentlyFollowing: boolean
): Promise<{ isFollowing?: boolean; error?: string }> {
  return currentlyFollowing ? unfollowUser(userId) : followUser(userId);
}
