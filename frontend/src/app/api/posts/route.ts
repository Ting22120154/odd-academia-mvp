import { addPost, getPosts } from "@/lib/posts";

export function GET() {
  return Response.json(getPosts());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (typeof b.title !== "string" || typeof b.content !== "string") {
    return Response.json(
      { error: "Missing required fields: title, content" },
      { status: 400 },
    );
  }

  const created = addPost({
    title: b.title,
    content: b.content,
    keywords: Array.isArray(b.keywords)
      ? (b.keywords.filter((x) => typeof x === "string") as string[])
      : [],
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
                : "User",
            bio: typeof (b.author as any).bio === "string" ? (b.author as any).bio : "",
            avatar:
              typeof (b.author as any).avatar === "string"
                ? (b.author as any).avatar
                : "/avatars/profile.svg",
          }
        : undefined,
  });

  return Response.json(created, { status: 201 });
}

