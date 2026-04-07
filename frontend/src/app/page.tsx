import Link from "next/link";
import { mockPosts } from "@/lib/mockPosts";

export default function HomePage() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Mock posts for routing demo. Member A can replace this later.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {mockPosts.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950"
          >
            <Link
              href={`/posts/${p.id}`}
              className="text-base font-semibold text-black hover:underline dark:text-white"
            >
              {p.title}
            </Link>
            {/* This card intentionally links to `/posts/[id]` so we can demo "click post → detail page" early. */}
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {p.summary}
            </div>
            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              {p.subject} · {p.authorName}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
