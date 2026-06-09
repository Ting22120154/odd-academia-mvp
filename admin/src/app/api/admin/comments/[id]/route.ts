import { NextRequest } from "next/server";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminUserFromPayload } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { payload } = auth;

  const { id } = await params;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return err("Comment not found.", 404);

  const adminUser = await getAdminUserFromPayload(payload);
  if (!adminUser) return err("Admin user not found.", 403);

  // DELETE: Remove comment record and all associated replies/reactions if hard-deleted
  await prisma.$transaction([
    prisma.comment.updateMany({ where: { parentId: id }, data: { isHidden: true } }),
    prisma.comment.update({ where: { id }, data: { isHidden: true } }),
    prisma.moderationLog.create({
      data: { adminId: adminUser.userId, action: "remove_comment", targetId: id, targetType: "comment" },
    }),
  ]);

  return ok({ ok: true });
}
