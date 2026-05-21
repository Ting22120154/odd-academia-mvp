import type { NotificationType, ReferenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getSeededPaperIds,
  paperPathForId,
} from "@/modules/papers/paper-route.service";
import type {
  ListNotificationsQuery,
  NotificationDisplayType,
  NotificationResponse,
} from "./types";

type NotificationRow = {
  id: string;
  type: NotificationType;
  referenceId: string | null;
  referenceType: ReferenceType | null;
  isRead: boolean;
  createdAt: Date;
};

function displayType(type: NotificationType): NotificationDisplayType {
  switch (type) {
    case "comment":
      return "Comment";
    case "reply":
      return "Reply";
    case "paper":
      return "Paper";
    case "contact":
      return "Contact";
    case "citation":
      return "Citation";
    case "follow":
      return "Paper";
    default:
      return "Comment";
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function paperCommentHref(
  paperId: string,
  commentId: string | null,
  seededPaperIds: string[],
): string {
  const base = paperPathForId(paperId, seededPaperIds);
  return commentId ? `${base}#comment-${commentId}` : base;
}

async function resolvePaperTitle(paperId: string): Promise<string> {
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    select: { title: true },
  });
  return paper?.title ?? "Paper";
}

async function resolveVisibleComment(commentId: string): Promise<{
  paperId: string;
} | null> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { paperId: true, isHidden: true },
  });
  if (!comment || comment.isHidden) return null;
  return { paperId: comment.paperId };
}

async function toNotificationResponse(
  row: NotificationRow,
  seededPaperIds: string[],
): Promise<NotificationResponse> {
  let text = "New notification";
  let href = "/notifications";

  if (row.type === "paper" && row.referenceType === "paper" && row.referenceId) {
    const title = await resolvePaperTitle(row.referenceId);
    text = `New paper published: ${title}`;
    href = paperPathForId(row.referenceId, seededPaperIds);
  } else if (row.type === "comment" && row.referenceType === "comment" && row.referenceId) {
    const comment = await resolveVisibleComment(row.referenceId);
    if (comment) {
      const title = await resolvePaperTitle(comment.paperId);
      text = `New comment on your paper: ${title}`;
      href = paperCommentHref(comment.paperId, row.referenceId, seededPaperIds);
    }
  } else if (row.type === "comment" && row.referenceType === "paper" && row.referenceId) {
    // Legacy rows: reference was paper id only — open paper comments section
    const title = await resolvePaperTitle(row.referenceId);
    text = `New comment on your paper: ${title}`;
    href = paperPathForId(row.referenceId, seededPaperIds);
  } else if (row.type === "reply" && row.referenceType === "comment" && row.referenceId) {
    const comment = await resolveVisibleComment(row.referenceId);
    if (comment) {
      const title = await resolvePaperTitle(comment.paperId);
      text = `New reply to your comment on ${title}`;
      href = paperCommentHref(comment.paperId, row.referenceId, seededPaperIds);
    } else {
      text = "New reply to your comment";
    }
  } else if (row.type === "citation") {
    text = "Your work was cited";
    if (row.referenceType === "paper" && row.referenceId) {
      const title = await resolvePaperTitle(row.referenceId);
      text = `Your work was cited: ${title}`;
      href = paperPathForId(row.referenceId, seededPaperIds);
    }
  } else if (row.type === "contact") {
    text = "Someone contacted you — check your email";
    href = "/notifications";
  } else if (row.type === "follow" && row.referenceType === "user" && row.referenceId) {
    text = "You have a new follower";
    href = `/user/${row.referenceId}`;
  }

  return {
    id: row.id,
    text,
    type: displayType(row.type),
    date: formatDate(row.createdAt),
    isRead: row.isRead,
    href,
    createdAt: row.createdAt.toISOString(),
  };
}

function tabWhere(tab: ListNotificationsQuery["tab"]) {
  if (tab === "new") return { isRead: false };
  if (tab === "papers") return { type: "paper" as const };
  if (tab === "comments") return { type: { in: ["comment", "reply"] as NotificationType[] } };
  if (tab === "contact") return { type: "contact" as const };
  if (tab === "citations") return { type: "citation" as const };
  return {};
}

export async function listNotifications(userId: string, query: ListNotificationsQuery) {
  const rows = await prisma.notification.findMany({
    where: { userId, ...tabWhere(query.tab) },
    orderBy:
      query.sort === "type"
        ? { type: query.dir }
        : { createdAt: query.dir },
    select: {
      id: true,
      type: true,
      referenceId: true,
      referenceType: true,
      isRead: true,
      createdAt: true,
    },
  });

  const seededPaperIds = await getSeededPaperIds();
  const notifications = await Promise.all(
    rows.map((row) => toNotificationResponse(row, seededPaperIds)),
  );
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { notifications, unreadCount };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const row = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!row || row.userId !== userId) throw new Error("NOT_FOUND");

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/** Called after a comment or reply is created. */
export async function createNotificationsForNewComment(input: {
  commentId: string;
  paperId: string;
  authorId: string;
  parentId: string | null;
}) {
  const paper = await prisma.paper.findUnique({
    where: { id: input.paperId },
    select: { id: true, authorId: true, title: true },
  });
  if (!paper) return;

  if (input.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: input.parentId },
      select: { authorId: true },
    });
    if (parent && parent.authorId !== input.authorId) {
      await prisma.notification.create({
        data: {
          userId: parent.authorId,
          type: "reply",
          referenceId: input.commentId,
          referenceType: "comment",
        },
      });
    }
    return;
  }

  if (paper.authorId !== input.authorId) {
    await prisma.notification.create({
      data: {
        userId: paper.authorId,
        type: "comment",
        referenceId: input.commentId,
        referenceType: "comment",
      },
    });
  }
}
