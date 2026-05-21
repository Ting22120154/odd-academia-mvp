import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

// APPEAL INFO: Admin contact email must be surfaced in both email and UI error message
const APPEAL_EMAIL = "support@oddacademia.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      papers: {
        where: { status: { not: "removed" } },
        include: { categories: true },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: {
          paper:   { select: { id: true, title: true } },
          reports: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: {
        select: { followers: true, following: true, papers: true },
      },
    },
  });

  if (!user) return err("User not found.", 404);

  return ok(user);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token   = (await cookies()).get("oa_admin_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return err("Unauthorised.", 401);

  const { id }   = await params;
  const body     = await req.json().catch(() => null);
  const action   = body?.action  as string | undefined;
  const reason   = body?.reason  as string | undefined;

  if (!action || !["warn", "ban", "unban"].includes(action)) {
    return err("action must be 'warn', 'ban', or 'unban'.");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return err("User not found.", 404);

  const adminUser = await prisma.adminUser.findUnique({ where: { adminEmail: payload.email } });
  if (!adminUser) return err("Admin user not found.", 403);

  type UserPatch = Parameters<typeof prisma.user.update>[0]["data"];
  type LogAction = "warn_user" | "ban_user" | "unban_user";

  let userPatch: UserPatch;
  let logAction: LogAction;

  if (action === "warn") {
    userPatch = { warnCount: { increment: 1 } };
    logAction = "warn_user";
  } else if (action === "ban") {
    // SUSPENSION FLOW: status update → revoke sessions → send email → in-app notification
    // SESSION CLEANUP: Revoke existing tokens when suspension is applied by admin
    // No server-side tokens exist; active sessions are invalidated on next app load via /api/auth/status
    userPatch = { isBanned: true, bannedAt: new Date() };
    logAction = "ban_user";
  } else {
    userPatch = { isBanned: false, bannedAt: null };
    logAction = "unban_user";
  }

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.user.update({ where: { id }, data: userPatch }),
    prisma.moderationLog.create({
      data: { adminId: adminUser.userId, action: logAction, targetId: id, targetType: "user" },
    }),
  ];

  if (action === "ban") {
    const notifId   = crypto.randomUUID();
    const notifBody =
      `Your account has been banned by an administrator.` +
      (reason ? ` Reason: ${reason}.` : "") +
      ` To appeal, contact: ${APPEAL_EMAIL}`;
    // $executeRaw bypasses Prisma client enum validation — 'moderation' exists in the DB enum
    // but the local generated client is stale. Remove this workaround after prisma generate runs.
    ops.push(
      prisma.$executeRaw`
        INSERT INTO "notifications" (id, user_id, type, body, reference_id, reference_type, is_read, created_at)
        VALUES (${notifId}, ${id}, 'moderation', ${notifBody}, ${id}, 'user', false, NOW())
      `
    );
    // TODO: POST to /api/email/suspension to send suspension email to user
  }

  const [updated] = await prisma.$transaction(ops);
  return ok(updated);
}
