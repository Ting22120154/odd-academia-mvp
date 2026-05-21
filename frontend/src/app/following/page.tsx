"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Tab = "papers" | "people" | "followers";

const TABS: { key: Tab; label: string }[] = [
  { key: "papers",    label: "Papers You Follow" },
  { key: "people",    label: "People You Follow" },
  { key: "followers", label: "People Following You" },
];

type FollowUser = {
  id:         string;
  fullName:   string;
  username:   string;
  workStatus: string;
  jobTitle:   string | null;
  avatarUrl:  string | null;
};

interface MockFollowedPaper {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  authorName: string;
}

const MOCK_FOLLOWED_PAPERS: MockFollowedPaper[] = [
  { id: "fp1", title: "Biohacking Techniques for Enhanced Performance",         desc: "Discover cutting-edge biohacking techniques to optimise performan...",       tags: ["AI infrastructure", "Computer science"],               authorName: "James B."    },
  { id: "fp2", title: "Investigating the Role of Biohacking Enhancing Ener...", desc: "Analysing the Effects of Biohacking Techniques on Energy Consumpti...",     tags: ["Smart grids", "Renewable energy sources"],             authorName: "Alex C."     },
  { id: "fp3", title: "The Impact of Biohacking on Urban Mobility and Sustain...",desc: "A Study of Biohacking Strategies for Green Urban Mobility",                tags: ["Public transportation", "Charging infrastructure"],    authorName: "Emily D"     },
  { id: "fp4", title: "Biohacking Innovations for Sustainable Urban Develop...", desc: "Detailing the integration of green building solutions to promote sust...", tags: ["Eco-friendly materials", "Energy-efficient design"],   authorName: "Michael H."  },
  { id: "fp5", title: "How High Rise Buildings Change the Landscape",           desc: "What to do in new urban settings",                                          tags: ["Architecture"],                                        authorName: "Alex C."     },
  { id: "fp6", title: "The Colour Blue",                                        desc: "Calming effects of one of the most popular colours",                        tags: ["Culture"],                                             authorName: "Alex C."     },
  { id: "fp7", title: "City Living and the History of Trams",                   desc: "How trams have gone from old to new in the modern world.",                  tags: ["Public transportation", "Charging infrastructure"],    authorName: "Michael H."  },
  { id: "fp8", title: "Our Mountain Landscape",                                 desc: "What global warmings effect on eco-friendly mountain living is.",           tags: ["Eco-friendly materials", "Energy-efficient design"],   authorName: "Alex C."     },
];

export default function FollowingPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [tab,          setTab]          = useState<Tab>("papers");
  const [following,    setFollowing]    = useState<FollowUser[]>([]);
  const [followers,    setFollowers]    = useState<FollowUser[]>([]);
  // followingIds: set of IDs the current user follows — used for O(1) "do I follow this person?" checks
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const fetchFollowData = useCallback(async () => {
    if (!user) return;
    setLoadingFollow(true);
    try {
      const res  = await fetch(`/api/follow?userId=${user.id}`);
      if (!res.ok) return;
      const data = await res.json() as {
        following:    FollowUser[];
        followers:    FollowUser[];
        followingIds: string[];
      };
      setFollowing(data.following);
      setFollowers(data.followers);
      setFollowingIds(new Set(data.followingIds));
    } finally {
      setLoadingFollow(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchFollowData();
  }, [fetchFollowData]);

  async function handleFollow(targetId: string) {
    if (!user) return;
    await fetch("/api/follow", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ followerId: user.id, followingId: targetId }),
    });
    void fetchFollowData();
  }

  async function handleUnfollow(targetId: string) {
    if (!user) return;
    await fetch("/api/follow", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ followerId: user.id, followingId: targetId }),
    });
    void fetchFollowData();
  }

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <h1 className="text-base font-semibold text-zinc-900">Following</h1>

      {/* Tabs */}
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

      {/* Papers You Follow */}
      {tab === "papers" && (
        <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-4 flex justify-end">
            <button type="button" className="text-sm font-medium text-[var(--brand)] hover:underline">
              View More
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_FOLLOWED_PAPERS.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
                <div className="h-32 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800" />
                <div className="p-3">
                  <div className="text-sm font-semibold text-zinc-900 line-clamp-2">{p.title}</div>
                  <div className="mt-1 text-xs text-zinc-500 line-clamp-2">{p.desc}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tags.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-200" />
                    <span className="text-xs text-zinc-500">{p.authorName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People You Follow — UI RULE: This list only renders confirmed follows — no Follow button needed here */}
      {tab === "people" && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {loadingFollow ? (
            <div className="col-span-full py-10 text-center text-sm text-zinc-400">Loading…</div>
          ) : following.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-zinc-400">You are not following anyone yet.</div>
          ) : (
            following.map((u) => (
              <PersonCard
                key={u.id}
                person={u}
                action="unfollow"
                onAction={() => handleUnfollow(u.id)}
              />
            ))
          )}
        </div>
      )}

      {/* People Following You */}
      {tab === "followers" && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {loadingFollow ? (
            <div className="col-span-full py-10 text-center text-sm text-zinc-400">Loading…</div>
          ) : followers.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-zinc-400">No one is following you yet.</div>
          ) : (
            followers.map((u) => (
              <PersonCard
                key={u.id}
                person={u}
                // Follow Back only shown when the current user does NOT already follow this person back
                action={followingIds.has(u.id) ? "following" : "follow-back"}
                onAction={() => handleFollow(u.id)}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

type CardAction = "unfollow" | "follow-back" | "following";

function PersonCard({
  person,
  action,
  onAction,
}: {
  person:   FollowUser;
  action:   CardAction;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-black/[0.06] bg-white p-5 shadow-[var(--shadow-sm)]">
      <Link href={`/user/${person.id}`}>
        <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-200" />
      </Link>
      <Link href={`/user/${person.id}`} className="mt-3 text-sm font-semibold text-zinc-900 hover:underline text-center">
        {person.fullName}
      </Link>
      <div className="text-xs text-zinc-500">@{person.username}</div>

      {action === "unfollow" && (
        // UI RULE: This list only renders confirmed follows — no Follow button needed here
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex h-8 items-center rounded-lg border border-black/[0.12] px-5 text-xs font-medium text-zinc-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          Unfollow
        </button>
      )}

      {action === "follow-back" && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex h-8 items-center rounded-lg bg-[var(--brand)] px-5 text-xs font-medium text-white hover:opacity-90"
        >
          Follow Back
        </button>
      )}

      {action === "following" && (
        <span className="mt-3 inline-flex h-8 items-center rounded-lg border border-black/[0.08] px-5 text-xs font-medium text-zinc-400">
          Following
        </span>
      )}
    </div>
  );
}
