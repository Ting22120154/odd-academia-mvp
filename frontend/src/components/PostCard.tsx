"use client";

import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/posts";

type Props = {
  // This card is used by both API-backed posts and older UI mock posts.
  // Keep it resilient so unrelated pages (e.g. Profile) don't crash.
  post: Post | any;
};

function getThumbSrc(id: number) {
  return `/post-thumbs/thumb-${((id - 1) % 6) + 1}.svg`;
}

export function PostCard({ post }: Props) {
  const idRaw = post?.id as unknown;
  const idNum =
    typeof idRaw === "number"
      ? idRaw
      : typeof idRaw === "string"
        ? Number(idRaw)
        : NaN;
  const thumbId = Number.isFinite(idNum) ? idNum : 1;

  const href = typeof idRaw === "string" ? `/paper/${idRaw}` : `/posts/${thumbId}`;

  const content =
    typeof post?.content === "string"
      ? post.content
      : typeof post?.description === "string"
        ? post.description
        : "";

  const tags: string[] = Array.isArray(post?.keywords)
    ? post.keywords
    : Array.isArray(post?.tags)
      ? post.tags
      : [];

  const authorName =
    typeof post?.author?.name === "string"
      ? post.author.name
      : typeof post?.authorName === "string"
        ? post.authorName
        : "User";

  const avatar =
    typeof post?.author?.avatar === "string"
      ? post.author.avatar
      : typeof post?.author?.avatarUrl === "string"
        ? post.author.avatarUrl
        : "/avatars/profile.svg";

  return (
    /*
     * Generic paper card used on profile ("Your Papers") and can be reused elsewhere.
     * It consumes the shared `Post` model from `lib/posts` (MVP in-memory / API).
     *
     * If we decide to unify post models later, this is one of the components to update.
     */
    <article className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/9] w-full bg-zinc-100">
        <Image
          src={getThumbSrc(thumbId)}
          alt={`${post.title} thumbnail`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      <div className="p-4">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-base font-semibold text-zinc-900 hover:underline">
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
          {content}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative h-7 w-7 overflow-hidden rounded-full bg-zinc-200">
            <Image
              src={avatar}
              alt={`${authorName} avatar`}
              fill
              className="object-cover"
              sizes="28px"
            />
          </div>
          <div className="text-sm text-zinc-700">{authorName}</div>
        </div>
      </div>
    </article>
  );
}
