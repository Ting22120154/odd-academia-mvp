"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { SuggestedPaperCard } from "@/components/SuggestedPaperCard";
import { usePublishedPapers } from "@/hooks/usePublishedPapers";
import {
  PAPER_CATEGORIES,
  paperMatchesCategoryFilter,
  type PaperCategory,
  type CategoryFilterMode,
} from "@/lib/papers/categories";

const CATEGORY_OPTIONS: PaperCategory[] = [...PAPER_CATEGORIES];

const btnHover =
  "cursor-pointer transition hover:opacity-95 hover:ring-2 hover:ring-[var(--brand)]/25 active:opacity-90";

const fieldHover =
  "transition hover:border-black/12 hover:ring-1 hover:ring-zinc-200/60 focus:border-black/20 focus:ring-2 focus:ring-[var(--brand)]/20";

const pillBtn =
  "cursor-pointer transition hover:bg-zinc-50 hover:opacity-95 hover:ring-1 hover:ring-inset hover:ring-zinc-200/70";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<PaperCategory[]>([]);
  const [filterMode, setFilterMode] = useState<CategoryFilterMode>("OR");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { papers, loading, error: loadError } = usePublishedPapers({ limit: 50 });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return papers.filter((p) => {
      if (
        !paperMatchesCategoryFilter(
          p.categories,
          p.tags,
          selectedCategories,
          filterMode,
        )
      ) {
        return false;
      }

      if (!q) return true;
      const haystack = [
        p.title,
        p.summary,
        p.subject,
        p.authorName,
        ...(p.categories ?? []),
        ...(p.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [papers, query, selectedCategories, filterMode]);

  function toggleCategory(cat: PaperCategory) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function removeCategory(cat: PaperCategory) {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat));
  }

  const showAll = selectedCategories.length === 0;

  return (
    <section className="w-full">
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Your Stats</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard title="Recent views" value="45" badge="+10%" sub="from last month" color="blue" />
          <StatCard title="Citation counts" value="6" badge="+10%" sub="from last month" color="purple" />
          <StatCard title="New Comments" value="55" sub="Above Average, last 30 days" color="teal" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900">Search Category Cards</div>

          <div className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={`h-10 w-full rounded-xl border border-black/[0.06] bg-white px-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ${fieldHover}`}
              />
            </div>
            <button
              type="button"
              className={`h-10 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white ${btnHover}`}
            >
              Go
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className={[
              "h-10 rounded-xl px-4 text-sm font-medium transition",
              showAll
                ? "bg-[rgba(0,102,255,0.12)] text-[var(--brand)] hover:opacity-95 hover:ring-2 hover:ring-[var(--brand)]/25"
                : `text-zinc-600 ${pillBtn}`,
            ].join(" ")}
          >
            All
          </button>

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-expanded={dropdownOpen}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-medium text-zinc-700 ${pillBtn}`}
            >
              Categories
              {selectedCategories.length > 0 ? (
                <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-xs text-[var(--brand)]">
                  {selectedCategories.length}
                </span>
              ) : null}
              <svg
                className={`h-4 w-4 text-zinc-400 transition ${dropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {dropdownOpen ? (
              <div className="absolute left-0 z-20 mt-1 max-h-64 w-64 overflow-y-auto rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg">
                {CATEGORY_OPTIONS.map((cat) => {
                  const checked = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${pillBtn} ${
                        checked ? "font-medium text-[var(--brand)]" : "text-zinc-700"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                          checked
                            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                            : "border-zinc-300"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      {cat}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="inline-flex items-center gap-2">
            <div
              className="relative inline-flex h-11 min-w-[9.5rem] rounded-full border border-zinc-200/90 bg-zinc-100 p-1 shadow-sm"
              role="group"
              aria-label="Category filter mode"
            >
              <span
                aria-hidden
                className={[
                  "pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[var(--brand)] shadow-sm",
                  "transition-all duration-200 ease-in-out",
                  filterMode === "OR" ? "left-1" : "left-[calc(50%+2px)]",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setFilterMode("OR")}
                aria-pressed={filterMode === "OR"}
                className={[
                  "relative z-10 flex flex-1 cursor-pointer items-center justify-center rounded-full px-5 py-2 text-sm font-semibold",
                  "transition-all duration-200 ease-in-out active:scale-[0.98]",
                  filterMode === "OR"
                    ? "text-white hover:opacity-90 hover:ring-2 hover:ring-inset hover:ring-white/30"
                    : "text-zinc-500 hover:bg-white hover:text-zinc-800 hover:shadow-sm hover:ring-1 hover:ring-inset hover:ring-zinc-200/80",
                ].join(" ")}
              >
                OR
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("AND")}
                aria-pressed={filterMode === "AND"}
                className={[
                  "relative z-10 flex flex-1 cursor-pointer items-center justify-center rounded-full px-5 py-2 text-sm font-semibold",
                  "transition-all duration-200 ease-in-out active:scale-[0.98]",
                  filterMode === "AND"
                    ? "text-white hover:opacity-90 hover:ring-2 hover:ring-inset hover:ring-white/30"
                    : "text-zinc-500 hover:bg-white hover:text-zinc-800 hover:shadow-sm hover:ring-1 hover:ring-inset hover:ring-zinc-200/80",
                ].join(" ")}
              >
                AND
              </button>
            </div>

            <div className="group/info relative">
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-base text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="How category filter mode works"
                title="Category filter help"
              >
                ⓘ
              </button>
              <div
                role="tooltip"
                className={[
                  "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-72 -translate-x-1/2",
                  "rounded-xl border border-black/[0.06] bg-white px-3.5 py-3 text-left text-xs leading-relaxed text-zinc-600 shadow-lg",
                  "opacity-0 transition-opacity duration-150",
                  "group-hover/info:opacity-100 group-focus-within/info:opacity-100",
                ].join(" ")}
              >
                <p>
                  <span className="font-semibold text-zinc-900">OR</span>
                  {" — "}
                  Show papers that match any of the selected categories
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-zinc-900">AND</span>
                  {" — "}
                  Show papers that match all of the selected categories
                </p>
                <span
                  aria-hidden
                  className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-white"
                />
              </div>
            </div>
          </div>
        </div>

        {selectedCategories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)]"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  className="cursor-pointer text-[var(--brand)] transition hover:opacity-70"
                  aria-label={`Remove ${cat}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              className={`text-xs text-zinc-500 underline-offset-2 ${pillBtn}`}
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-900">
            Suggested Paper For You
            {!loading && papers.length > 0 ? (
              <span className="ml-2 font-normal text-zinc-500">
                ({filtered.length}
                {selectedCategories.length > 0
                  ? ` · ${filterMode} filter`
                  : ""}
                )
              </span>
            ) : null}
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading papers…</p>
        ) : loadError ? (
          <p className="mt-4 text-sm text-red-600">{loadError}</p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            {selectedCategories.length > 0
              ? "No papers match the selected categories."
              : "No published papers found."}
          </p>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <SuggestedPaperCard key={p.id} post={p} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  badge,
  sub,
  color = "blue",
}: {
  title: string;
  value: string;
  badge?: string;
  sub: string;
  color?: "blue" | "purple" | "teal";
}) {
  const dotColor = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    teal: "bg-teal-500",
  }[color];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-4">
      <div className={`h-3 w-3 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-zinc-500">{title}</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="text-2xl font-bold text-zinc-900">{value}</div>
          {badge && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
              {badge}
            </span>
          )}
          <span className="text-xs text-zinc-400">{sub}</span>
        </div>
      </div>
    </div>
  );
}
