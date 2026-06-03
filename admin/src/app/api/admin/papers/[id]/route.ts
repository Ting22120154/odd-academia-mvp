import { NextRequest } from "next/server";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { payload } = auth;

  const { id } = await params;

  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) return err("Paper not found.", 404);

  const adminUser = await prisma.adminUser.findUnique({ where: { adminEmail: payload.email } });
  if (!adminUser) return err("Admin user not found.", 403);

  const [updated] = await prisma.$transaction([
    prisma.paper.update({ where: { id }, data: { status: "removed" } }),
    prisma.moderationLog.create({
      data: { adminId: adminUser.userId, action: "remove_paper", targetId: id, targetType: "paper" },
    }),
  ]);

  return ok(updated);
}
