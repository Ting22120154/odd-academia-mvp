import Link from "next/link";
import type { MockPost } from "@/lib/mockPosts";

type Props = {
  post: MockPost;
};

/**
 * Card UI aligned with Figma "Suggested Paper For You":
 * - gradient header strip (mesh-like via multi-stop gradients)
 * - title + clamped summary
 * - tag pills
 * - author row + small decorative fold (visual only)
 *
 * The whole card links to `/paper/[id]` to meet the shareable URL requirement.
 */
export function SuggestedPaperCard({ post }: Props) {
  const tags = post.tags?.length ? post.tags : [post.subject];
  const headerClass =
    post.headerGradientClass ??
    "bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300";

  const initial = post.authorName.trim().charAt(0).toUpperCase() || "?";

  return (
    <li className="group relative list-none">
      <Link
        href={`/paper/${post.id}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      >
        {/* Decorative header — matches Figma “abstract gradient” strip */}
        <div className={`relative h-28 w-full shrink-0 ${headerClass}`} aria-hidden />

        <div className="flex flex-1 flex-col gap-3 p-4">
          <h2 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900">
            {post.title}
          </h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">
            {post.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 2).map((t) => (
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

        {/* Bottom-right fold decoration (Figma “dog-ear”) */}
        <span
          className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 border-b-[14px] border-l-[14px] border-b-sky-200/90 border-l-transparent"
          aria-hidden
        />
      </Link>
    </li>
  );
}
