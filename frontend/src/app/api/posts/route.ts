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

