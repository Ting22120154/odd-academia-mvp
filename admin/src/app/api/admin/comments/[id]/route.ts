import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token   = (await cookies()).get("oa_admin_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return err("Unauthorised.", 401);

  const { id } = await params;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return err("Comment not found.", 404);

  const adminUser = await prisma.adminUser.findUnique({ where: { adminEmail: payload.email } });
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
