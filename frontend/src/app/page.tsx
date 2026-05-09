"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { SuggestedPaperCard } from "@/components/SuggestedPaperCard";
import { mockPosts as suggestedPosts } from "@/lib/mockPosts";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, isGuest } = useAuth();
  const displayName = isGuest ? "Guest" : (user?.fullName ?? "User");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suggestedPosts.filter((p) => {
      if (!q) return true;
      const haystack = [p.title, p.summary, p.subject, p.authorName, ...(p.tags ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      {/* Top header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-zinc-200" />
          <div>
            <div className="text-sm font-semibold text-zinc-900">{displayName}</div>
            <div className="text-xs text-zinc-500">Welcome back to Odd Academia</div>
          </div>
        </div>

        {!isGuest && (
          <Link
            href="/upload"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            <span className="text-white/90" aria-hidden>
              ⤴
            </span>
            Submit New Paper
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-11 w-full rounded-xl border border-black/[0.06] bg-white px-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
          />
        </div>
      </div>

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
        <div className="text-sm font-semibold text-zinc-900">Search Category Cards</div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          <CategoryCard title="All" gradient="from-sky-500 via-indigo-600 to-emerald-500" />
          <CategoryCard title="Pop Culture" gradient="from-fuchsia-600 via-indigo-700 to-sky-500" />
          <CategoryCard title="Biohacking" gradient="from-amber-500 via-orange-600 to-lime-500" />
          <CategoryCard title="Maths" gradient="from-emerald-600 via-lime-500 to-amber-500" />
          <CategoryCard title="Sustainability" gradient="from-emerald-700 via-teal-600 to-lime-500" />
        </div>
      </div>

      {/* Suggested */}
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Suggested Paper For You</div>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.slice(0, 4).map((p) => (
            <SuggestedPaperCard key={p.id} post={p} />
          ))}
        </ul>
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
