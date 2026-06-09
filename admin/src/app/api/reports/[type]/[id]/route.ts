import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminUserFromPayload } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/prisma";

function reportModerationAction(action: "review" | "dismiss" | "delete_comment") {
  if (action === "delete_comment") return "remove_comment" as const;
  return action === "dismiss" ? "dismiss_report" as const : "review_report" as const;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { payload } = auth;

  const { type, id } = await params;
  const body       = await req.json().catch(() => null);
  const action     = body?.action as string | undefined;
  const adminNote  = (body?.adminNote as string | undefined)?.trim() || null;
  const outcome    = (body?.outcome as string | undefined) ?? null;

  if (action !== "review" && action !== "dismiss" && action !== "delete_comment") {
    return err("action must be 'review', 'dismiss', or 'delete_comment'.");
  }

  const newStatus = action === "dismiss" ? "dismissed" : "reviewed";
  const adminUser = await getAdminUserFromPayload(payload);

  if (type === "paper") {
    const report = await prisma.paperReport.findUnique({
      where:   { id },
      include: { paper: { select: { authorId: true } } },
    });
    if (!report) return err("Report not found.", 404);

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.paperReport.update({
        where: { id },
        data: {
          status:     newStatus,
          adminNote,
          outcome,
          resolvedAt: new Date(),
          resolvedBy: payload.email,
        },
      }),
    ];

    if (adminUser && report.paperId) {
      ops.push(
        prisma.moderationLog.create({
          data: {
            adminId:    adminUser.userId,
            action:     reportModerationAction(action),
            targetId:   report.paperId,
            targetType: "paper",
            note:       adminNote,
          },
        }),
      );
    }

    const authorId = report.paper?.authorId;
    if (authorId) {
      const verb = action === "dismiss" ? "dismissed (no violation found)" : "reviewed by a moderator";
      const notifBody = `A report about your paper has been ${verb}.${adminNote ? ` Note: ${adminNote}` : ""}`;
      const notifId   = crypto.randomUUID();
      const refId     = report.paperId ?? null;
      ops.push(
        refId
          ? prisma.$executeRaw`
              INSERT INTO "notifications" (id, user_id, type, body, reference_id, reference_type, is_read, created_at)
              VALUES (${notifId}, ${authorId}, 'moderation', ${notifBody}, ${refId}, 'paper', false, NOW())
            `
          : prisma.$executeRaw`
              INSERT INTO "notifications" (id, user_id, type, body, is_read, created_at)
              VALUES (${notifId}, ${authorId}, 'moderation', ${notifBody}, false, NOW())
            `,
      );
    }

    await prisma.$transaction(ops);
    return ok({ ok: true });
  }

  if (type === "user") {
    const report = await prisma.userReport.findUnique({ where: { id } });
    if (!report) return err("Report not found.", 404);

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.userReport.update({
        where: { id },
        data: {
          status:     newStatus,
          adminNote,
          outcome,
          resolvedAt: new Date(),
          resolvedBy: payload.email,
        },
      }),
    ];

    if (adminUser) {
      ops.push(
        prisma.moderationLog.create({
          data: {
            adminId:    adminUser.userId,
            action:     reportModerationAction(action),
            targetId:   report.reportedId,
            targetType: "user",
            note:       adminNote,
          },
        }),
      );
    }

    const verb = action === "dismiss" ? "dismissed (no violation found)" : "reviewed by a moderator";
    const notifBody = `A report about your account has been ${verb}.${adminNote ? ` Note: ${adminNote}` : ""}`;
    const notifId   = crypto.randomUUID();
    ops.push(
      prisma.$executeRaw`
        INSERT INTO "notifications" (id, user_id, type, body, reference_id, reference_type, is_read, created_at)
        VALUES (${notifId}, ${report.reportedId}, 'moderation', ${notifBody}, ${report.reportedId}, 'user', false, NOW())
      `,
    );

    await prisma.$transaction(ops);
    return ok({ ok: true });
  }

  if (type === "comment") {
    const report = await prisma.commentReport.findUnique({
      where:   { id },
      include: { comment: { select: { id: true, authorId: true } } },
    });
    if (!report) return err("Report not found.", 404);

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.commentReport.update({
        where: { id },
        data: {
          status:     newStatus,
          adminNote,
          outcome,
          resolvedAt: new Date(),
          resolvedBy: payload.email,
        },
      }),
    ];

    if (action === "delete_comment" && report.commentId) {
      ops.push(
        prisma.comment.updateMany({ where: { parentId: report.commentId }, data: { isHidden: true } }),
        prisma.comment.update({ where: { id: report.commentId }, data: { isHidden: true } }),
      );
    }

    if (adminUser && report.commentId) {
      ops.push(
        prisma.moderationLog.create({
          data: {
            adminId:    adminUser.userId,
            action:     reportModerationAction(action),
            targetId:   report.commentId,
            targetType: "comment",
            note:       adminNote,
          },
        }),
      );
    }

    const authorId = report.comment?.authorId;
    if (authorId) {
      const verb = action === "delete_comment"
        ? "removed"
        : outcome === "No Violation" || !outcome
          ? "reviewed (no violation found)"
          : `flagged as ${outcome.toLowerCase()}`;
      const notifBody = `Your comment was reviewed by a moderator and ${verb}.${adminNote ? ` Reason: ${adminNote}` : ""}`;
      const notifId   = crypto.randomUUID();
      const refId     = report.commentId ?? null;
      ops.push(
        refId
          ? prisma.$executeRaw`
              INSERT INTO "notifications" (id, user_id, type, body, reference_id, reference_type, is_read, created_at)
              VALUES (${notifId}, ${authorId}, 'moderation', ${notifBody}, ${refId}, 'comment', false, NOW())
            `
          : prisma.$executeRaw`
              INSERT INTO "notifications" (id, user_id, type, body, is_read, created_at)
              VALUES (${notifId}, ${authorId}, 'moderation', ${notifBody}, false, NOW())
            `,
      );
    }

    await prisma.$transaction(ops);
    return ok({ ok: true });
  }

  return err("type must be 'paper', 'comment', or 'user'.");
}
