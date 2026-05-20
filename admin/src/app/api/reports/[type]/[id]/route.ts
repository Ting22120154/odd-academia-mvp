import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const { type, id } = await params;
  const body   = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (action !== "review" && action !== "dismiss") {
    return err("action must be 'review' or 'dismiss'.");
  }

  const newStatus = action === "review" ? "reviewed" : "dismissed";

  if (type === "paper") {
    const updated = await prisma.paperReport.update({ where: { id }, data: { status: newStatus } });
    return ok(updated);
  }
  if (type === "comment") {
    const updated = await prisma.commentReport.update({ where: { id }, data: { status: newStatus } });
    return ok(updated);
  }
  if (type === "user") {
    const updated = await prisma.userReport.update({ where: { id }, data: { status: newStatus } });
    return ok(updated);
  }

  return err("type must be 'paper', 'comment', or 'user'.");
}
