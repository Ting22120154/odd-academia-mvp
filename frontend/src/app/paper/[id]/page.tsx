import { getMockPostById } from "@/lib/mockPosts";
import { PaperDetailClient } from "@/app/paper/_components/PaperDetailClient";

export default async function PaperDetailPage({
  params,
}: {
  /**
   * Dynamic route: `/paper/:id`
   *
   * Requirement from client docs: generate a unique URL per paper so it can be shared.
   */
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getMockPostById(id);

  if (!post) {
    return <div className="mx-auto max-w-6xl">Paper not found.</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{post.title}</h1>

        <div className="mt-2 text-sm text-zinc-600">
          <div>
            <strong>Author:</strong> {post.authorName}
          </div>
          <div>
            <strong>Category:</strong> {post.subject}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-black/[0.06] bg-zinc-100 px-2.5 py-0.5 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-base leading-7 text-zinc-700">{post.summary}</p>

        <div className="mt-8">
          <div className="text-sm font-semibold text-zinc-900">Reader</div>
          <p className="mt-1 text-sm text-zinc-500">
            MVP: uses browser PDF viewer for now. Upload + storage will replace
            this later.
          </p>

          {post.fileType === "pdf" && post.fileUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.08]">
              <iframe
                title="PDF reader"
                src={post.fileUrl}
                className="h-[70vh] w-full bg-white"
              />
            </div>
          ) : post.fileUrl ? (
            <a
              href={post.fileUrl}
              className="mt-4 inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Download file
            </a>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-black/[0.15] p-6 text-sm text-zinc-600">
              No file URL yet.
            </div>
          )}
        </div>
      </section>

      <PaperDetailClient post={post} />
    </div>
  );
}

