"use client";

import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/posts";

type Props = {
  post: Post;
};

function getThumbSrc(id: number) {
  return `/post-thumbs/thumb-${((id - 1) % 6) + 1}.svg`;
}

export function PostCard({ post }: Props) {
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
          src={getThumbSrc(post.id)}
          alt={`${post.title} thumbnail`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      <div className="p-4">
        <Link href={`/posts/${post.id}`} className="block">
          <h3 className="line-clamp-2 text-base font-semibold text-zinc-900 hover:underline">
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
          {post.content}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {post.keywords.slice(0, 4).map((t) => (
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
              src={post.author.avatar ?? "/avatars/profile.svg"}
              alt={`${post.author.name} avatar`}
              fill
              className="object-cover"
              sizes="28px"
            />
          </div>
          <div className="text-sm text-zinc-700">{post.author.name}</div>
        </div>
      </div>
    </article>
  );
}
