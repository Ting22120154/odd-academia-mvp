"use client";

import { useState } from "react";
import Link from "next/link";
import type { MockPost } from "@/lib/mockPosts";
import { CategoryIcon } from "@/lib/papers/categoryIcons";
import { getPaperCoverFallbacks } from "@/lib/papers/categoryCovers";
import {
  getPaperBrowseCategories,
  normalizeCategory,
  type PaperCategory,
} from "@/lib/papers/categories";

type Props = {
  post: MockPost;
  /** Pass true for the first ~4 cards (above the fold) so the browser fetches them immediately. */
  eager?: boolean;
};

function CoverImage({
  category,
  paperId,
  eager,
}: {
  category: PaperCategory | null;
  paperId: string;
  eager?: boolean;
}) {
  const candidates = getPaperCoverFallbacks(category, paperId);
  const [index, setIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const src = candidates[Math.min(index, candidates.length - 1)]!;

  const handleError = () => {
    if (index >= candidates.length - 1) {
      setAllFailed(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="relative h-32 w-full shrink-0 overflow-hidden bg-[#eef4ff]">
      {allFailed ? (
        // Inline fallback — no network request, always renders
        <div className="flex h-full w-full items-center justify-center">
          <svg
            className="h-10 w-10 text-[#b8cff7]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={src}
          src={src}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={handleError}
        />
      )}
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

function UserAvatar({
  name,
  src,
  className = "h-8 w-8",
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (src && !failed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover bg-zinc-200`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700`}
    >
      {initial}
    </span>
  );
}

/**
 * Figma-style paper card: topical cover photo + title, summary, tags, author.
 */
export function SuggestedPaperCard({ post, eager }: Props) {
  // Single call — primaryCategory is just browseCategories[0] with a subject fallback.
  const browseCategories = getPaperBrowseCategories(
    post.categories ?? [],
    post.tags ?? [],
  );
  const primaryCategory: PaperCategory | null =
    browseCategories[0] ?? normalizeCategory(post.subject ?? "") ?? null;

  const tags = (
    browseCategories.length > 0
      ? browseCategories
      : primaryCategory
        ? [primaryCategory]
        : post.subject
          ? [post.subject]
          : []
  ).slice(0, 2);

  const contributors = post.contributors ?? [];

  return (
    <li className="group relative list-none">
      <Link
        href={`/paper/${post.id}`}
        className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-[transform,box-shadow,opacity] hover:-translate-y-0.5 hover:opacity-[0.98] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:ring-2 hover:ring-zinc-200/60 active:translate-y-0 active:opacity-95"
      >
        <CoverImage
          category={primaryCategory}
          paperId={post.id}
          eager={eager}
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

          <div className="mt-auto space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <UserAvatar name={post.authorName} src={post.authorAvatarUrl} />
              <span className="text-sm font-medium text-zinc-800">{post.authorName}</span>
            </div>
            {contributors.length > 0 ? (
              <p className="text-xs leading-snug text-zinc-500 line-clamp-2">
                Contributions by {contributors.map((c) => c.label).join(", ")}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}
