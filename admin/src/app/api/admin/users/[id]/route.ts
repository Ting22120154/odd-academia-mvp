import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminUserFromPayload } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/prisma";

// APPEAL INFO: Admin contact email must be surfaced in both email and UI error message
const APPEAL_EMAIL = "support@oddacademia.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

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
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { payload } = auth;

  const { id }   = await params;
  const body     = await req.json().catch(() => null);
  const action   = body?.action  as string | undefined;
  const reason   = body?.reason  as string | undefined;

  if (!action || !["warn", "ban", "unban"].includes(action)) {
    return err("action must be 'warn', 'ban', or 'unban'.");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return err("User not found.", 404);

  const adminUser = await getAdminUserFromPayload(payload);
  if (!adminUser) return err("Admin user not found.", 403);

  type UserPatch = Parameters<typeof prisma.user.update>[0]["data"];
  type LogAction = "warn_user" | "ban_user" | "unban_user";

  let userPatch: UserPatch;
  let logAction: LogAction;
  let newWarnCount = 0;

  if (action === "warn") {
    newWarnCount = user.warnCount + 1;
    // ESCALATION: Auto-suspend triggers at warningCount >= 4
    userPatch = newWarnCount >= 4
      ? { warnCount: newWarnCount, isBanned: true, bannedAt: new Date() }
      : { warnCount: newWarnCount };
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

  // WARNING SYSTEM: Each warning is logged with admin, reason, and timestamp
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.user.update({ where: { id }, data: userPatch }),
    prisma.moderationLog.create({
      data: { adminId: adminUser.userId, action: logAction, targetId: id, targetType: "user", note: reason ?? null },
    }),
  ];

  if (action === "warn") {
    const warnId   = crypto.randomUUID();
    const warnBody =
      `You have received a warning from a moderator.` +
      (reason ? ` Reason: ${reason}.` : "") +
      ` This is warning ${newWarnCount} of 4.` +
      (newWarnCount < 4 ? " Please review our community guidelines." : "");
    // NOTIFICATION: User must be informed of every warning with running count shown
    // $executeRaw bypasses Prisma client enum validation — 'moderation' exists in the DB enum
    // but the local generated client is stale. Remove this workaround after prisma generate runs.
    ops.push(
      prisma.$executeRaw`
        INSERT INTO "notifications" (id, user_id, type, body, is_read, created_at)
        VALUES (${warnId}, ${id}, 'moderation', ${warnBody}, false, NOW())
      `
    );

    if (newWarnCount >= 4) {
      // ESCALATION: Auto-suspend triggers at warningCount >= 4 — fire suspension notification too
      const suspId   = crypto.randomUUID();
      const suspBody =
        `Your account has been suspended after reaching 4 warnings.` +
        ` To appeal, please contact: ${APPEAL_EMAIL}`;
      ops.push(
        prisma.$executeRaw`
          INSERT INTO "notifications" (id, user_id, type, body, reference_id, reference_type, is_read, created_at)
          VALUES (${suspId}, ${id}, 'moderation', ${suspBody}, ${id}, 'user', false, NOW())
        `
      );
    }
  }

  if (action === "ban") {
    const notifId   = crypto.randomUUID();
    const notifBody =
      `Your account has been suspended.` +
      (reason ? ` Reason: ${reason}.` : "") +
      ` To appeal, please contact: ${APPEAL_EMAIL}`;
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
