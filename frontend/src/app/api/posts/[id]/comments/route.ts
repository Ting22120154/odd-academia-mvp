import { getRouteUserId } from "@/lib/auth/require-auth";
import * as commentService from "@/modules/comments/comment.service";

/** Legacy comment endpoint for `/posts/[id]` — backed by the DB comment service. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRouteUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (typeof b.text !== "string" || !b.text.trim()) {
    return Response.json(
      { error: "Missing required field: text" },
      { status: 400 },
    );
  }

  try {
    const created = await commentService.createComment(userId, {
      paperId: id,
      content: b.text.trim(),
    });

    return Response.json(
      {
        id: created.id,
        user: created.user.fullName,
        text: created.content,
        date: created.createdAt,
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "PAPER_NOT_FOUND") {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }
    return Response.json({ error: msg }, { status: 400 });
  }
}
