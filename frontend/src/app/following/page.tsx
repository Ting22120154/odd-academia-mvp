"use client";

/**
 * Following hub — People/Followers tabs use real user UUIDs from the DB.
 * Papers tab is still a placeholder (paper-follow not in schema yet).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchFollowersList,
  fetchFollowingList,
  toggleFollow,
  type FollowAuthor,
} from "@/lib/follow-client";

type Tab = "papers" | "people" | "followers";

const TABS: { key: Tab; label: string }[] = [
  { key: "papers", label: "Papers You Follow" },
  { key: "people", label: "People You Follow" },
  { key: "followers", label: "People Following You" },
];

export default function FollowingPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("people");
  const [people, setPeople] = useState<FollowAuthor[]>([]);
  const [followers, setFollowers] = useState<FollowAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [followingRes, followersRes] = await Promise.all([
      fetchFollowingList(),
      fetchFollowersList(),
    ]);
    if (followingRes.error) setError(followingRes.error);
    else setPeople(followingRes.people ?? []);
    if (followersRes.error && !followingRes.error) setError(followersRes.error);
    else setFollowers(followersRes.people ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadLists();
  }, [isLoggedIn, loadLists]);

  async function handleToggle(userId: string, currentlyFollowing: boolean, list: "people" | "followers") {
    setBusyId(userId);
    const { isFollowing, error: err } = await toggleFollow(userId, currentlyFollowing);
    setBusyId(null);
    if (err) {
      setError(err);
      return;
    }
    if (list === "people") {
      if (isFollowing) {
        setPeople((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, isFollowing: true } : p))
        );
      } else {
        setPeople((prev) => prev.filter((p) => p.id !== userId));
      }
    } else {
      setFollowers((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, isFollowing: !!isFollowing } : p))
      );
    }
  }

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <h1 className="text-base font-semibold text-zinc-900">Following</h1>

      <div className="mt-4 flex items-center gap-2 border-b border-black/[0.06]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "rounded-t-lg px-4 pb-2.5 pt-1.5 text-sm font-medium transition",
              tab === t.key
                ? "border-b-2 border-[var(--brand)] text-[var(--brand)]"
                : "text-zinc-500 hover:text-zinc-900",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading && tab !== "papers" && (
        <p className="mt-6 text-sm text-zinc-500">Loading…</p>
      )}

      {tab === "papers" && (
        <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
          <p className="text-sm text-zinc-500">Paper follows coming soon.</p>
        </div>
      )}

      {tab === "people" && !loading && (
        <div className="mt-6">
          {people.length === 0 ? (
            <p className="text-sm text-zinc-500">You are not following anyone yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {people.map((p) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  busy={busyId === p.id}
                  actionLabel={p.isFollowing ? "Unfollow" : "Follow"}
                  onAction={() => handleToggle(p.id, p.isFollowing, "people")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "followers" && !loading && (
        <div className="mt-6">
          {followers.length === 0 ? (
            <p className="text-sm text-zinc-500">No followers yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {followers.map((p) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  busy={busyId === p.id}
                  actionLabel={p.isFollowing ? "Unfollow" : "Follow Back"}
                  onAction={() => handleToggle(p.id, p.isFollowing, "followers")}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PersonCard({
  person,
  actionLabel,
  busy,
  onAction,
}: {
  person: FollowAuthor;
  actionLabel: string;
  busy?: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-black/[0.06] bg-white p-5 shadow-[var(--shadow-sm)]">
      <Link href={`/user/${person.id}`}>
        <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-200">
          {person.avatarUrl && (
            <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </Link>
      <Link href={`/user/${person.id}`} className="mt-3 text-sm font-semibold text-zinc-900 hover:underline">
        {person.name}
      </Link>
      <div className="text-xs text-zinc-500">@{person.username}</div>
      <button
        type="button"
        disabled={busy}
        onClick={onAction}
        className="mt-3 inline-flex h-8 items-center rounded-lg bg-[var(--brand)] px-5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "…" : actionLabel}
      </button>
    </div>
  );
}
