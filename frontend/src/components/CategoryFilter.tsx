"use client";

import type { PostCategory } from "@/data/mockPosts";

type Props = {
  categories: PostCategory[];
  selected: PostCategory;
  onChange: (category: PostCategory) => void;
};

export function CategoryFilter({ categories, selected, onChange }: Props) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {categories.map((c) => {
        const active = c === selected;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={[
              "rounded-full px-3 py-1 text-sm font-medium transition",
              "border",
              active
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
            ].join(" ")}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
