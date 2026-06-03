import { NextRequest } from "next/server";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id: paperId } = await params;
  const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { id: true } });
  if (!paper) return err("Paper not found.", 404);

  const rows = await prisma.comment.findMany({
    where: { paperId, parentId: null, isHidden: false },
    include: {
      author: { select: { fullName: true } },
      replies: {
        where: { isHidden: false },
        include: { author: { select: { fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const comments = rows.map((c) => ({
    id: c.id,
    author: c.author.fullName,
    text: c.content,
    isFlagged: c.isFlagged,
    replies: c.replies.map((r) => ({
      id: r.id,
      author: r.author.fullName,
      text: r.content,
      isFlagged: r.isFlagged,
      badge: r.isFlagged ? ("Pending Review" as const) : undefined,
    })),
  }));

  return ok({ comments });
}
