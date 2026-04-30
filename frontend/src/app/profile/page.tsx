import { ProfileForm } from "@/components/ProfileForm";
import { mockUser } from "@/data/mockUser";
import { PostCard } from "@/components/PostCard";
import { mockPosts } from "@/data/mockPosts";

export default function ProfilePage() {
  return (
    <section className="mx-auto w-full max-w-[var(--page-max)] space-y-4">
      <div className="text-sm font-semibold text-zinc-900">Profile</div>

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        <div className="h-24 bg-gradient-to-r from-rose-200 via-amber-200 to-zinc-200" />
        <div className="flex items-center gap-5 px-6 pb-6 pt-4">
          <div className="-mt-10 h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-zinc-200" />
          <div className="flex-1">
            <div className="text-lg font-semibold text-zinc-900">
              {mockUser.fullName.replace("Smith", "Taylor")}
            </div>
          </div>

          <div className="flex gap-3">
            <MiniStat title="Papers" value="16" />
            <MiniStat title="Comments" value="28" />
          </div>
        </div>
      </div>

      {/* About me */}
      <ProfileForm user={mockUser} />

      {/* Your papers */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-900">Your Papers</div>
          <button
            type="button"
            className="rounded-lg border border-black/[0.06] bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            View All
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockPosts.slice(0, 4).map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex min-w-[132px] items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <span className="text-xs">●</span>
      </div>
      <div>
        <div className="text-xs text-zinc-500">{title}</div>
        <div className="text-lg font-semibold text-zinc-900">{value}</div>
      </div>
    </div>
  );
}
