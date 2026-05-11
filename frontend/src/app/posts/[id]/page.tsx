import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addComment, getPostById, getPosts } from "@/lib/posts";
import { revalidatePath } from "next/cache";

function getThumbSrc(id: number) {
  return `/post-thumbs/thumb-${((id - 1) % 6) + 1}.svg`;
}

/**
 * Backward-compatible route.
 * Numeric IDs served by the shared `lib/posts` layer keep this URL (incl. comments).
 * Other IDs forward to `/paper/:id` (shareable URL + Figma mock detail).
 */
export default async function LegacyPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPostById(id);

  if (!post) {
    redirect(`/paper/${id}`);
  }

  const relatedPosts = getPosts()
    .filter((candidate) => candidate.id !== post.id)
    .slice(0, 4);

  async function createComment(formData: FormData) {
    "use server";
    const text = String(formData.get("text") ?? "").trim();
    const user = String(formData.get("user") ?? "").trim();
    if (!text) return;

    addComment(id, {
      text,
      user: user || "User",
    });
    revalidatePath(`/posts/${id}`);
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mx-auto relative h-16 w-16 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
              <Image
                src={post.author.avatar || "/avatars/profile.svg"}
                alt={`${post.author.name} avatar`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="mt-3 text-center">
              <div className="font-semibold text-zinc-900">{post.author.name}</div>
              <p className="mt-1 text-sm text-zinc-600">{post.author.bio || "OddAcademia contributor"}</p>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Follow Author
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">Related Papers</div>
            <div className="mt-3 space-y-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/posts/${related.id}`}
                  className="flex gap-3 rounded-xl p-2 transition hover:bg-zinc-50"
                >
                  <div className="relative h-16 w-20 overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={getThumbSrc(related.id)}
                      alt={related.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-sm font-medium text-zinc-900">
                      {related.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {related.content}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-zinc-500">
              {new Date(post.date).toLocaleDateString()}
            </div>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Login/Create Account
            </Link>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700"
              >
                {keyword}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 sm:grid-cols-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">Downloads</div>
              <div className="mt-1 text-lg font-semibold text-zinc-900">{post.stats.downloads}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">Rating</div>
              <div className="mt-1 text-lg font-semibold text-zinc-900">{post.stats.rating}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">Shares</div>
              <div className="mt-1 text-lg font-semibold text-zinc-900">{post.stats.shares}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">Citations</div>
              <div className="mt-1 text-lg font-semibold text-zinc-900">{post.stats.citations}</div>
            </div>
          </div>

          <div className="relative mt-6 aspect-[16/8] overflow-hidden rounded-2xl bg-zinc-100">
            <Image
              src={getThumbSrc(post.id)}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 900px"
            />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900">Abstract</h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-zinc-700">
              {post.content}
            </p>
          </div>

          <section className="mt-10 border-t border-zinc-200 pt-8">
            <h2 className="text-lg font-semibold text-zinc-900">Comments</h2>
            <form action={createComment} className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                <input
                  name="user"
                  placeholder="Your name"
                  className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
                />
                <textarea
                  name="text"
                  required
                  rows={3}
                  placeholder="Add your thoughts about this paper..."
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="mt-3 inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Comment
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {post.comments.length === 0 ? (
                <div className="text-sm text-zinc-600">No comments yet.</div>
              ) : (
                post.comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-900">
                      {comment.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="font-medium text-zinc-900">{comment.user}</div>
                        <div className="text-xs text-zinc-500">
                          {new Date(comment.date).toLocaleString()}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">{comment.text}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </article>
      </div>
    </section>
  );
}
