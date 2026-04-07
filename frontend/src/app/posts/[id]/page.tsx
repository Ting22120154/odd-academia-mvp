import { getMockPostById } from "@/lib/mockPosts";

export default async function PostDetailPage({
  params,
}: {
  /**
   * Next.js App Router provides dynamic route params.
   *
   * In newer Next versions, `params` may be typed as a Promise in server components
   * (depending on the generated types). We await it to keep the implementation compatible
   * with the current template typings.
   */
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // MVP approach: use mock data until Member A/B/C pages and backend APIs are ready.
  const post = getMockPostById(id);

  if (!post) {
    return <div className="mx-auto max-w-3xl">Post not found.</div>;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-black dark:text-white">
        {post.title}
      </h1>
      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        <div>
          <strong>Author:</strong> {post.authorName}
        </div>
        <div>
          <strong>Subject:</strong> {post.subject}
        </div>
      </div>
      <p className="mt-6 text-base leading-7 text-zinc-800 dark:text-zinc-200">
        {post.summary}
      </p>
    </section>
  );
}

