import { NextRequest } from "next/server";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ paperId: string; commentId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { commentId } = await params;

  const body = await req.json().catch(() => null);
  if (typeof body?.isHidden !== "boolean") {
    return err("isHidden (boolean) is required.", 400);
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data:  { isHidden: body.isHidden },
    include: {
      author:  { select: { id: true, fullName: true, username: true } },
      paper:   { select: { id: true, title: true } },
      reports: {
        include: { reporter: { select: { id: true, fullName: true, username: true } } },
      },
      _count: { select: { reports: true } },
    },
  });

  return ok({ comment });
}
