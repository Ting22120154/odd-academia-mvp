"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PostCard } from "@/components/PostCard";
import { SearchIcon } from "@/components/icons";
import { CATEGORIES, mockPosts, type PostCategory } from "@/data/mockPosts";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] =
    useState<PostCategory>("Trending");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockPosts.filter((p) => {
      const categoryOk =
        selectedCategory === "Trending" || p.category === selectedCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      const haystack = [
        p.title,
        p.description,
        p.category,
        p.author.name,
        ...p.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, selectedCategory]);

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="text-sm text-zinc-600">Home</div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-zinc-700">
            Search Category Cards
          </div>

          <div className="flex w-full max-w-md items-center gap-2 self-start sm:self-auto">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
              onClick={() => {
                // no-op for now; state already filters.
              }}
            >
              Go
            </button>
          </div>
        </div>

        <div className="mt-4">
          <CategoryFilter
            categories={CATEGORIES}
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold text-zinc-900">
              Popular Papers
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              View More
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 text-sm text-zinc-600">
              No papers match your filters.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
