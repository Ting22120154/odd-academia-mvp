"use client";

import Image from "next/image";
import type { MockPost } from "@/data/mockPosts";

type Props = {
  post: MockPost;
};

export function PostCard({ post }: Props) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/9] w-full bg-zinc-100">
        <Image
          src={post.image.src}
          alt={post.image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-zinc-900">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
          {post.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.slice(0, 4).map((t) => (
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
              src={post.author.avatarUrl ?? "/avatars/profile.svg"}
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
