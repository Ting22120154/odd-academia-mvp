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
