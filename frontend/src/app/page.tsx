"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { SuggestedPaperCard } from "@/components/SuggestedPaperCard";
import { mockPosts as suggestedPosts } from "@/lib/mockPosts";

const CATEGORY_TABS = ["For You", "Following", "Biohacking", "Maths", "Sustainability"] as const;

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof CATEGORY_TABS)[number]>("For You");

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
