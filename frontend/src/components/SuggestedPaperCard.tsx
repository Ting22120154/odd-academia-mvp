"use client";

import { useState } from "react";
import Link from "next/link";
import type { MockPost } from "@/lib/mockPosts";
import { CategoryIcon } from "@/lib/papers/categoryIcons";
import {
  getPaperCoverFallbacks,
} from "@/lib/papers/categoryCovers";
import {
  getPaperBrowseCategories,
  getPrimaryPaperCategory,
  type PaperCategory,
} from "@/lib/papers/categories";

type Props = {
  post: MockPost;
};

function CoverImage({
  category,
  paperId,
}: {
  category: PaperCategory | null;
  paperId: string;
}) {
  const candidates = getPaperCoverFallbacks(category, paperId);
  const [index, setIndex] = useState(0);
  const src = candidates[Math.min(index, candidates.length - 1)]!;

  return (
    <div className="relative h-32 w-full shrink-0 overflow-hidden bg-[#eef4ff]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
        onError={() => {
          setIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />
      {category ? (
        <span className="absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-800 shadow-sm backdrop-blur-sm">
          <CategoryIcon category={category} className="h-3 w-3 shrink-0 text-[var(--brand)]" aria-hidden />
          <span className="truncate">{category}</span>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Figma-style paper card: topical cover photo + title, summary, tags, author.
 */
export function SuggestedPaperCard({ post }: Props) {
  const browseCategories = getPaperBrowseCategories(
    post.categories ?? [],
    post.tags ?? [],
  );
  const primaryCategory = getPrimaryPaperCategory(
    post.categories,
    post.tags,
    post.subject,
  );
  const tags = (
    browseCategories.length > 0
      ? browseCategories
      : primaryCategory
        ? [primaryCategory]
        : post.subject
          ? [post.subject]
          : []
  ).slice(0, 2);

  const initial = post.authorName.trim().charAt(0).toUpperCase() || "?";

  return (
    <li className="group relative list-none">
      <Link
        href={`/paper/${post.id}`}
        className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-[transform,box-shadow,opacity] hover:-translate-y-0.5 hover:opacity-[0.98] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:ring-2 hover:ring-zinc-200/60 active:translate-y-0 active:opacity-95"
      >
        <CoverImage
          category={primaryCategory}
          paperId={post.id}
        />

        <div className="flex flex-1 flex-col gap-3 p-4">
          <h2 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900">
            {post.title}
          </h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">
            {post.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-black/[0.06] bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
                {initial}
              </span>
              <span className="text-sm font-medium text-zinc-800">
                {post.authorName}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
