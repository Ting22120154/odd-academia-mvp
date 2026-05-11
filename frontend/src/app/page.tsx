"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { PostCard } from "@/components/PostCard";
import { SuggestedPaperCard } from "@/components/SuggestedPaperCard";
import { mockPosts as suggestedMockPosts, type MockPost } from "@/lib/mockPosts";
import type { Post } from "@/lib/posts";

const CATEGORY_TABS = ["For You", "Following", "Biohacking", "Maths", "Sustainability"] as const;

type HomeTab = (typeof CATEGORY_TABS)[number];

function suggestedMatchesTab(p: MockPost, tab: HomeTab): boolean {
  if (tab === "For You" || tab === "Following") return true;
  const haystack = [p.title, p.summary, p.subject, p.authorName, ...(p.tags ?? [])]
    .join(" ")
    .toLowerCase();
  const tabTerms: Record<Exclude<HomeTab, "For You" | "Following">, string[]> = {
    Biohacking: ["bio", "biomarker", "wearable", "stress", "recovery", "sleep", "health"],
    Maths: ["math", "gradient", "convex", "proof", "optimization", "quantum"],
    Sustainability: ["sustain", "green", "energy", "renewable", "climate"],
  };
  return tabTerms[tab].some((term) => haystack.includes(term));
}

function categoryMatchesApiPost(post: Post, tab: HomeTab): boolean {
  if (tab === "For You" || tab === "Following") return true;

  const haystack = [post.title, post.content, post.author.bio, ...post.keywords]
    .join(" ")
    .toLowerCase();

  const categoryTerms: Record<Exclude<HomeTab, "For You" | "Following">, string[]> = {
    Biohacking: ["bio", "biomarker", "wearable", "stress", "recovery", "sleep"],
    Maths: ["math", "gradient", "convex", "proof", "optimization"],
    Sustainability: ["sustain", "green", "energy", "renewable", "climate"],
  };

  return categoryTerms[tab].some((term) => haystack.includes(term));
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<HomeTab>("For You");

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch("/api/posts", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Post[];
        setPosts(data);
      } finally {
        setLoading(false);
      }
    }

    void loadPosts();
  }, []);

  const suggestedFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suggestedMockPosts.filter((p) => {
      if (!suggestedMatchesTab(p, activeTab)) return false;
      if (!q) return true;
      const haystack = [p.title, p.summary, p.subject, p.authorName, ...(p.tags ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeTab]);

  const apiFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (!categoryMatchesApiPost(p, activeTab)) return false;
      if (!q) return true;
      const haystack = [p.title, p.content, p.author.name, p.author.bio, ...p.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, query, activeTab]);

  return (
    <section className="w-full">
      {/* Your stats */}
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Your Stats</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard title="Recent views" value="451" sub="+10% from last month" />
          <StatCard title="Citation counts" value="6" sub="+10% from last month" />
          <StatCard title="New Comments" value="55" sub="Above Average, last 30 days" />
        </div>
      </div>

      {/* Category cards */}
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900">Search Category Cards</div>

          {/* Search on the right matches the Figma dashboard header row. */}
          <div className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-xl border border-black/[0.06] bg-white px-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
              />
            </div>
            <button
              type="button"
              className="h-10 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white hover:opacity-95"
            >
              Go
            </button>
          </div>
        </div>

        {/* Category tabs row (matches Figma: selected pill + inline tabs). */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {CATEGORY_TABS.map((t) => {
            const active = t === activeTab;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={[
                  "h-10 rounded-xl px-4 text-sm font-medium transition",
                  active
                    ? "bg-[rgba(0,102,255,0.12)] text-[var(--brand)]"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                ].join(" ")}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested (Figma mock cards → /paper/[id]) */}
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Suggested Paper For You</div>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {suggestedFiltered.slice(0, 4).map((p) => (
            <SuggestedPaperCard key={p.id} post={p} />
          ))}
        </ul>
      </div>

      {/* API-backed feed (same filters + search) */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-zinc-900">Popular Papers</div>
          <Link
            href="/"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            View More
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading posts...</div>
          ) : null}
          {apiFiltered.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>

        {!loading && apiFiltered.length === 0 ? (
          <div className="mt-6 text-sm text-zinc-600">No papers match your filters.</div>
        ) : null}
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <span className="text-xs">●</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-zinc-500">{title}</div>
        <div className="mt-1 flex items-center gap-3">
          <div className="text-xl font-semibold text-zinc-900">{value}</div>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ title, gradient }: { title: string; gradient: string }) {
  return (
    <button
      type="button"
      className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]"
    >
      <div className={`h-[86px] w-full bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-black/10 opacity-0 transition group-hover:opacity-100" />
      <div className="absolute bottom-3 left-3 text-sm font-semibold text-white drop-shadow">
        {title}
      </div>
      <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
        <span className="text-xs">↗</span>
      </div>
    </button>
  );
}
