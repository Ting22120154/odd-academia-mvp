import { getPostById, updatePost } from "@/lib/posts";
import { revalidatePath } from "next/cache";

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await params;
  const post = getPostById(id);

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(post);
}

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  try {
    const updated = updatePost(id, {
      title: typeof b.title === "string" ? b.title : undefined,
      content: typeof b.content === "string" ? b.content : undefined,
      keywords: Array.isArray(b.keywords)
        ? (b.keywords.filter((x) => typeof x === "string") as string[])
        : undefined,
      categories: Array.isArray(b.categories)
        ? (b.categories.filter((x) => typeof x === "string") as string[])
        : undefined,
      publishedDate: typeof b.publishedDate === "string" ? b.publishedDate : undefined,
      doi: typeof b.doi === "string" ? b.doi : undefined,
      references: Array.isArray(b.references)
        ? (b.references.filter((x) => typeof x === "string") as string[])
        : undefined,
      contributors: Array.isArray(b.contributors)
        ? (b.contributors.filter(
            (x) =>
              x &&
              typeof x === "object" &&
              typeof (x as any).label === "string" &&
              (typeof (x as any).href === "string" || typeof (x as any).href === "undefined"),
          ) as { label: string; href?: string }[])
        : undefined,
      attachment:
        b.attachment && typeof b.attachment === "object"
          ? {
              fileName:
                typeof (b.attachment as any).fileName === "string"
                  ? (b.attachment as any).fileName
                  : "paper.pdf",
              mimeType:
                typeof (b.attachment as any).mimeType === "string"
                  ? (b.attachment as any).mimeType
                  : "application/pdf",
              sizeBytes:
                typeof (b.attachment as any).sizeBytes === "number"
                  ? (b.attachment as any).sizeBytes
                  : 0,
            }
          : undefined,
      author:
        b.author && typeof b.author === "object"
          ? {
              name:
                typeof (b.author as any).name === "string"
                  ? (b.author as any).name
                  : undefined,
              bio: typeof (b.author as any).bio === "string" ? (b.author as any).bio : undefined,
              avatar:
                typeof (b.author as any).avatar === "string"
                  ? (b.author as any).avatar
                  : undefined,
            }
          : undefined,
    });

    revalidatePath(`/posts/${id}`);
    revalidatePath(`/posts/${id}/edit`);
    revalidatePath(`/`);
    return Response.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Post not found" ? 404 : 400;
    return Response.json({ error: msg }, { status });
  }
}
