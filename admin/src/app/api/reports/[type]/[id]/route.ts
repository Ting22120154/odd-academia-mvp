import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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
  const body    = await req.json().catch(() => null);
  const action  = body?.action as string | undefined;

  if (action !== "review" && action !== "dismiss" && action !== "delete_comment") {
    return err("action must be 'review', 'dismiss', or 'delete_comment'.");
  }

  const newStatus = action === "dismiss" ? "dismissed" : "reviewed";

  if (type === "paper") {
    const updated = await prisma.paperReport.update({ where: { id }, data: { status: newStatus } });
    return ok(updated);
  }

  if (type === "user") {
    const updated = await prisma.userReport.update({ where: { id }, data: { status: newStatus } });
    return ok(updated);
  }

  if (type === "comment") {
    // MODERATION: Admin notes and outcome must be persisted on the report record
    const adminNote = body?.adminNote as string | undefined;
    const outcome   = body?.outcome   as string | undefined;
    const payload   = verifyToken(token)!;

    const report = await prisma.commentReport.findUnique({
      where:   { id },
      include: { comment: { select: { id: true, authorId: true } } },
    });
    if (!report) return err("Report not found.", 404);

    const adminUser = await prisma.adminUser.findUnique({ where: { adminEmail: payload.email } });

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.commentReport.update({
        where: { id },
        data: {
          status:     newStatus,
          adminNote:  adminNote ?? null,
          outcome:    outcome   ?? null,
          resolvedAt: new Date(),
          resolvedBy: payload.email,
        },
      }),
    ];

    // DELETE: Remove comment record and all associated replies/reactions if hard-deleted
    if (action === "delete_comment" && report.commentId) {
      ops.push(
        prisma.comment.updateMany({ where: { parentId: report.commentId }, data: { isHidden: true } }),
        prisma.comment.update({ where: { id: report.commentId }, data: { isHidden: true } }),
      );
      if (adminUser) {
        ops.push(
          prisma.moderationLog.create({
            data: {
              adminId:    adminUser.userId,
              action:     "remove_comment",
              targetId:   report.commentId,
              targetType: "comment",
              note:       adminNote ?? null,
            },
          })
        );
      }
    }

    // NOTIFICATION: Author must always be notified on review completion
    const authorId = report.comment?.authorId;
    if (authorId) {
      const verb = action === "delete_comment"
        ? "removed"
        : outcome === "No Violation" || !outcome
          ? "reviewed (no violation found)"
          : `flagged as ${outcome.toLowerCase()}`;
      const notifBody   = `Your comment was reviewed by a moderator and ${verb}.${adminNote ? ` Reason: ${adminNote}` : ""}`;
      const notifId     = crypto.randomUUID();
      const refId       = report.commentId ?? null;
      const refType     = report.commentId ? "comment" : null;
      // $executeRaw bypasses Prisma client enum validation — 'moderation' exists in the DB enum
      // but the local generated client is stale. Remove this workaround after prisma generate runs.
      ops.push(
        refId
          ? prisma.$executeRaw`
              INSERT INTO "notifications" (id, user_id, type, body, reference_id, reference_type, is_read, created_at)
              VALUES (${notifId}, ${authorId}, 'moderation', ${notifBody}, ${refId}, 'comment', false, NOW())
            `
          : prisma.$executeRaw`
              INSERT INTO "notifications" (id, user_id, type, body, is_read, created_at)
              VALUES (${notifId}, ${authorId}, 'moderation', ${notifBody}, false, NOW())
            `
      );
    }

    await prisma.$transaction(ops);
    return ok({ ok: true });
  }

  return err("type must be 'paper', 'comment', or 'user'.");
}
