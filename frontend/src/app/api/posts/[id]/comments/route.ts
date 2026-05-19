import { addComment } from "@/lib/posts";

export async function POST(
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
  if (typeof b.text !== "string") {
    return Response.json(
      { error: "Missing required field: text" },
      { status: 400 },
    );
  }

  try {
    const created = addComment(id, {
      text: b.text,
      user: typeof b.user === "string" ? b.user : undefined,
    });
    return Response.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Post not found" ? 404 : 400;
    return Response.json({ error: msg }, { status });
  }
}

