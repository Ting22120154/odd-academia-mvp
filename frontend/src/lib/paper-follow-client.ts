/**
 * Browser-side helpers for paper follow APIs.
 */

type ApiRes<T> = { success: true; data: T } | { success: false; error: string };

export type FollowedPaper = {
  id: string;
  title: string;
  authorName: string;
  authorAvatarUrl?: string;
};

export type PaperFollowStatus = {
  isFollowing: boolean;
  followerCount: number;
};

async function safeReadApiJson<T>(res: Response): Promise<ApiRes<T>> {
  // Some error paths (proxy/dev overlay) can produce an empty body.
  const text = await res.text().catch(() => "");
  if (!text) {
    return {
      success: false,
      error: `Empty response (status ${res.status})`,
    };
  }
  try {
    return JSON.parse(text) as ApiRes<T>;
  } catch {
    return {
      success: false,
      error: `Non-JSON response (status ${res.status})`,
    };
  }
}

export async function fetchPaperFollowStatus(
  paperId: string,
): Promise<PaperFollowStatus & { error?: string }> {
  const res = await fetch(`/api/papers/${paperId}/follow-status`, {
    credentials: "include",
  });
  const json = await safeReadApiJson<PaperFollowStatus>(res);
  if (!json.success) return { isFollowing: false, followerCount: 0, error: json.error };
  return json.data;
}

export async function followPaper(
  paperId: string,
): Promise<{ isFollowing?: boolean; followerCount?: number; error?: string }> {
  const res = await fetch(`/api/papers/${paperId}/follow`, {
    method: "POST",
    credentials: "include",
  });
  const json = await safeReadApiJson<PaperFollowStatus>(res);
  if (!json.success) return { error: json.error };
  return {
    isFollowing: json.data.isFollowing,
    followerCount: json.data.followerCount,
  };
}

export async function unfollowPaper(
  paperId: string,
): Promise<{ isFollowing?: boolean; followerCount?: number; error?: string }> {
  const res = await fetch(`/api/papers/${paperId}/follow`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await safeReadApiJson<PaperFollowStatus>(res);
  if (!json.success) return { error: json.error };
  return {
    isFollowing: json.data.isFollowing,
    followerCount: json.data.followerCount,
  };
}

export async function togglePaperFollow(
  paperId: string,
  currentlyFollowing: boolean,
): Promise<{ isFollowing?: boolean; followerCount?: number; error?: string }> {
  return currentlyFollowing ? unfollowPaper(paperId) : followPaper(paperId);
}

export async function fetchFollowedPapersList(): Promise<{
  papers?: FollowedPaper[];
  error?: string;
}> {
  const res = await fetch("/api/users/me/followed-papers", {
    credentials: "include",
  });
  const json = await safeReadApiJson<{ papers: FollowedPaper[] }>(res);
  if (!json.success) return { error: json.error };
  return { papers: json.data.papers };
}
