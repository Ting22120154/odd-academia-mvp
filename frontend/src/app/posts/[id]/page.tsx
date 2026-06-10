import { formatDateAU, formatDateTimeAU } from "@odd-academia/db/date";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Post } from "@/lib/posts";

function getThumbSrc(id: number) {
  return `/post-thumbs/thumb-${((id - 1) % 6) + 1}.svg`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getOrigin(): string {
  const h = headers() as any;
  const proto = h.get?.("x-forwarded-proto") ?? "http";
  const host = h.get?.("host") ?? "127.0.0.1:3000";
  return `${proto}://${host}`;
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
  const origin = getOrigin();
  const postRes = await fetch(`${origin}/api/posts/${id}`, { cache: "no-store" });
  if (!postRes.ok) {
    redirect(`/paper/${id}`);
  }
  const post = (await postRes.json()) as Post;

  const relatedRes = await fetch(`${origin}/api/posts`, { cache: "no-store" });
  const relatedAll = (relatedRes.ok ? ((await relatedRes.json()) as Post[]) : []) ?? [];
  const relatedPosts = relatedAll.filter((candidate) => candidate.id !== post.id).slice(0, 4);

  async function createComment(formData: FormData) {
    "use server";
    const text = String(formData.get("text") ?? "").trim();
    const user = String(formData.get("user") ?? "").trim();
    if (!text) return;

    const origin = getOrigin();
    await fetch(`${origin}/api/posts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user: user || "User" }),
      cache: "no-store",
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

          {(post.contributors?.length ||
            isNonEmptyString(post.doi) ||
            isNonEmptyString(post.publishedDate) ||
            post.categories?.length ||
            post.attachment) ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-zinc-900">Paper Details</div>
              <div className="mt-3 space-y-3 text-sm text-zinc-700">
                {post.categories?.length ? (
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Categories</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.categories.slice(0, 6).map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isNonEmptyString(post.publishedDate) ? (
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Published</div>
                    <div className="mt-1">{formatDateAU(post.publishedDate)}</div>
                  </div>
                ) : null}

                {isNonEmptyString(post.doi) ? (
                  <div>
                    <div className="text-xs font-medium text-zinc-500">DOI</div>
                    <div className="mt-1 break-all">{post.doi}</div>
                  </div>
                ) : null}

                {post.contributors?.length ? (
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Contributors</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.contributors.map((c) =>
                        c.href ? (
                          <Link
                            key={c.label}
                            href={c.href}
                            className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:underline"
                          >
                            {c.label}
                          </Link>
                        ) : (
                          <span
                            key={c.label}
                            className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                          >
                            {c.label}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}

                {post.attachment ? (
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Attachment</div>
                    <div className="mt-1 text-xs text-zinc-600">
                      {post.attachment.fileName} •{" "}
                      {Math.round(post.attachment.sizeBytes / 1024)} KB
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

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
              {formatDateAU(post.date)}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Edit Paper
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                Login/Create Account
              </Link>
            </div>
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

          {post.references?.length ? (
            <section className="mt-10 border-t border-zinc-200 pt-8">
              <h2 className="text-lg font-semibold text-zinc-900">Citation</h2>
              <div className="mt-4 space-y-2">
                {post.references.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-zinc-50 px-4 py-3"
                  >
                    <div className="text-sm text-blue-700 underline underline-offset-2">
                      {c}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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
                          {formatDateTimeAU(comment.date)}
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
