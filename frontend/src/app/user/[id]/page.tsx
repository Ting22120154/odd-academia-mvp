"use client";

/**
 * Another user's public profile. [id] must be a DB user UUID (not mock "1"/"2").
 * GET /api/users/[id]; follow via POST/DELETE /api/users/[id]/follow.
 * Own id redirects to /profile.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toggleFollow } from "@/lib/follow-client";
import {
  fetchUserProfile,
  formatCount,
  socialHref,
  type ProfileUser,
} from "@/lib/profile-client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: sessionUser, isLoggedIn } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (sessionUser?.id === id) {
      router.replace("/profile");
      return;
    }
    if (!UUID_RE.test(id)) {
      setError("Invalid user id.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { user, isFollowing: following, error: err } = await fetchUserProfile(id);
      if (cancelled) return;
      if (err || !user) setError(err ?? "User not found.");
      else {
        setProfile(user);
        setIsFollowing(!!following);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, sessionUser?.id, router]);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[var(--page-max)] py-12 text-center text-sm text-zinc-500">
        Loading profile…
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="mx-auto w-full max-w-[var(--page-max)] py-12 text-center text-sm text-red-600">
        {error ?? "User not found."}
      </section>
    );
  }

  const githubUrl = socialHref(profile.github, "github");
  const linkedinUrl = socialHref(profile.linkedin, "linkedin");

  async function handleFollowToggle() {
    if (!id || followBusy) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setFollowBusy(true);
    const { isFollowing: next, error: err } = await toggleFollow(id, isFollowing);
    setFollowBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setIsFollowing(!!next);
    if (profile && typeof next === "boolean") {
      const delta = next ? 1 : -1;
      setProfile({
        ...profile,
        stats: {
          ...profile.stats,
          followers: Math.max(0, profile.stats.followers + delta),
        },
      });
    }
  }

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)] space-y-6">
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        <div className="h-36 bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-200">
              {profile.avatarUrl && (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-zinc-900">{profile.fullName}</h1>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>@{profile.username}</span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                  {profile.workStatus}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/user/${id}/message`}
                className="inline-flex h-9 items-center rounded-lg border border-[var(--brand)] px-4 text-xs font-semibold text-[var(--brand)] hover:bg-blue-50"
              >
                Contact
              </Link>
              <button
                type="button"
                disabled={followBusy}
                onClick={handleFollowToggle}
                className={[
                  "inline-flex h-9 items-center rounded-lg px-4 text-xs font-semibold hover:opacity-95 disabled:opacity-60",
                  isFollowing
                    ? "border border-[var(--brand)] bg-white text-[var(--brand)]"
                    : "bg-[var(--brand)] text-white",
                ].join(" ")}
              >
                {followBusy ? "…" : isFollowing ? "Unfollow" : "Follow Author"}
              </button>
            </div>
          </div>

          {profile.bio && <p className="mt-4 text-sm text-zinc-600">{profile.bio}</p>}

          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>
              <strong className="text-zinc-900">{formatCount(profile.stats.followers)}</strong>{" "}
              <span className="text-zinc-500">followers</span>
            </span>
            <span>
              <strong className="text-zinc-900">{formatCount(profile.stats.following)}</strong>{" "}
              <span className="text-zinc-500">following</span>
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-900">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                </svg>
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-900">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065ZM6.918 20.452H3.756V9h3.162v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Engagement Metrics</div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {(
            [
              ["Papers", profile.stats.papers],
              ["Followers", formatCount(profile.stats.followers)],
              ["Saved Papers", profile.stats.savedPapers],
              ["Cited Comments", profile.stats.citedComments],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[var(--brand)]">
                <span className="text-sm font-bold">•</span>
              </div>
              <div>
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="text-xl font-bold text-zinc-900">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-4 text-sm font-semibold text-zinc-900">Papers</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profile.papers.length === 0 ? (
            <p className="col-span-full text-sm text-zinc-500">No published papers yet.</p>
          ) : (
            profile.papers.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
                <div className="h-32 bg-gradient-to-br from-indigo-400 via-blue-500 to-purple-600" />
                <div className="p-3">
                  <div className="text-sm font-semibold text-zinc-900 line-clamp-2">{p.title}</div>
                  <div className="mt-1 text-xs text-zinc-500 line-clamp-2">{p.description}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tags.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
