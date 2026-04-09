import { SuggestedPaperCard } from "@/components/SuggestedPaperCard";
import { mockPosts } from "@/lib/mockPosts";

/**
 * Dashboard home (MVP): "Suggested Paper For You" row styled toward client Figma.
 * Member A may later add sidebar, stats, and search — routing + post cards stay here for demo.
 */
export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Light panel like Figma content area */}
      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          Suggested Paper For You
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Mock data + layout for code review; connect to API later.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockPosts.map((p) => (
            <SuggestedPaperCard key={p.id} post={p} />
          ))}
        </ul>
      </section>
    </div>
  );
}
