import type { NotificationType, ReferenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getSeededPaperIds,
  paperPathForId,
} from "@/modules/papers/paper-route.service";
import {
  groupKeyForRow,
  mergeNotificationGroups,
  type ResolvedNotification,
} from "./notification-grouping";
import type {
  ListNotificationsQuery,
  ListNotificationsResult,
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

const ROW_SELECT = {
  id: true,
  type: true,
  referenceId: true,
  referenceType: true,
  isRead: true,
  createdAt: true,
} as const;

function displayType(type: NotificationType): NotificationDisplayType {
  switch (type) {
    case "comment":
      return "Comment";
    case "reply":
      return "Reply";
    case "like":
      return "Comment";
    case "paper":
      return "Paper";
    case "contact":
      return "MESSAGE";
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

function tabWhere(tab: ListNotificationsQuery["tab"]) {
  if (tab === "new") return { isRead: false };
  if (tab === "papers") return { type: "paper" as const };
  if (tab === "comments") return { type: { in: ["comment", "reply", "like"] as NotificationType[] } };
  if (tab === "contact") return { type: "contact" as const };
  if (tab === "citations") return { type: "citation" as const };
  return {};
}

async function loadCommentLookup(
  rows: NotificationRow[],
): Promise<Map<string, { paperId: string; parentId: string | null; isHidden: boolean }>> {
  const commentIds = new Set<string>();
  for (const row of rows) {
    if (row.referenceType === "comment" && row.referenceId) {
      commentIds.add(row.referenceId);
    }
  }
  if (commentIds.size === 0) return new Map();

  const comments = await prisma.comment.findMany({
    where: { id: { in: [...commentIds] } },
    select: { id: true, paperId: true, parentId: true, isHidden: true },
  });
  return new Map(comments.map((c) => [c.id, c]));
}

async function loadPaperTitles(paperIds: Set<string>): Promise<Map<string, string>> {
  if (paperIds.size === 0) return new Map();
  const papers = await prisma.paper.findMany({
    where: { id: { in: [...paperIds] } },
    select: { id: true, title: true },
  });
  return new Map(papers.map((p) => [p.id, p.title]));
}

function resolvePaperIdForRow(
  row: NotificationRow,
  commentById: Map<string, { paperId: string; parentId: string | null; isHidden: boolean }>,
): string | null {
  if (row.referenceType === "paper" && row.referenceId) return row.referenceId;
  if (row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment && !comment.isHidden) return comment.paperId;
  }
  return null;
}

function resolveOne(
  row: NotificationRow,
  seededPaperIds: string[],
  commentById: Map<string, { paperId: string; parentId: string | null; isHidden: boolean }>,
  titleByPaperId: Map<string, string>,
): ResolvedNotification {
  const paperId = resolvePaperIdForRow(row, commentById);
  const paperTitle = paperId ? (titleByPaperId.get(paperId) ?? "Paper") : null;

  let text = "New notification";
  let href = "/notifications";
  let anchorCommentId: string | null = null;

  if (row.type === "paper" && row.referenceType === "paper" && row.referenceId) {
    text = `New paper published: ${paperTitle ?? "Paper"}`;
    href = paperPathForId(row.referenceId, seededPaperIds);
  } else if (row.type === "comment" && row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment && !comment.isHidden) {
      text = `New comment on your paper: ${paperTitle ?? "Paper"}`;
      anchorCommentId = row.referenceId;
      href = paperCommentHref(comment.paperId, row.referenceId, seededPaperIds);
    }
  } else if (row.type === "comment" && row.referenceType === "paper" && row.referenceId) {
    text = `New comment on your paper: ${paperTitle ?? "Paper"}`;
    href = paperPathForId(row.referenceId, seededPaperIds);
  } else if (row.type === "reply" && row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment && !comment.isHidden) {
      const anchor = comment.parentId ?? row.referenceId;
      anchorCommentId = anchor;
      text = `New reply to your comment on ${paperTitle ?? "Paper"}`;
      href = paperCommentHref(comment.paperId, anchor, seededPaperIds);
    } else {
      text = "New reply to your comment";
    }
  } else if (row.type === "like" && row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment && !comment.isHidden) {
      anchorCommentId = row.referenceId;
      text = `Someone liked your comment on ${paperTitle ?? "Paper"}`;
      href = paperCommentHref(comment.paperId, row.referenceId, seededPaperIds);
    } else {
      text = "Someone liked your comment";
    }
  } else if (row.type === "citation") {
    text = "Your work was cited";
    if (row.referenceType === "paper" && row.referenceId) {
      text = `Your work was cited: ${paperTitle ?? "Paper"}`;
      href = paperPathForId(row.referenceId, seededPaperIds);
    }
  } else if (row.type === "contact" && row.referenceType === "user" && row.referenceId) {
    text = "Sent you a message";
    href = `/user/${row.referenceId}?chat=1`;
  } else if (row.type === "contact") {
    text = "Someone contacted you";
  } else if (row.type === "follow" && row.referenceType === "user" && row.referenceId) {
    text = "You have a new follower";
    href = `/user/${row.referenceId}`;
  }

  const groupKey = groupKeyForRow(row, commentById);

  return {
    id: row.id,
    ids: [row.id],
    text,
    type: displayType(row.type),
    date: formatDate(row.createdAt),
    isRead: row.isRead,
    href,
    createdAt: row.createdAt.toISOString(),
    groupCount: 1,
    groupKey,
    rawType: row.type,
    paperTitle,
  };
}

async function resolveAndGroup(
  rows: NotificationRow[],
  seededPaperIds: string[],
): Promise<NotificationResponse[]> {
  const commentById = await loadCommentLookup(rows);
  const paperIds = new Set<string>();
  for (const row of rows) {
    const paperId = resolvePaperIdForRow(row, commentById);
    if (paperId) paperIds.add(paperId);
    if (row.referenceType === "paper" && row.referenceId) paperIds.add(row.referenceId);
  }
  const titleByPaperId = await loadPaperTitles(paperIds);
  const resolved = rows.map((row) =>
    resolveOne(row, seededPaperIds, commentById, titleByPaperId),
  );
  return mergeNotificationGroups(resolved);
}

function sortResolved(items: NotificationResponse[], query: ListNotificationsQuery) {
  const mul = query.dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (query.sort === "type") return a.type.localeCompare(b.type) * mul;
    return a.createdAt.localeCompare(b.createdAt) * mul;
  });
}

export async function listNotifications(
  userId: string,
  query: ListNotificationsQuery,
): Promise<ListNotificationsResult> {
  const seededPaperIds = await getSeededPaperIds();
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  if (query.tab === "new") {
    const [unreadRows, readRows] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: "desc" },
        select: ROW_SELECT,
      }),
      prisma.notification.findMany({
        where: { userId, isRead: true },
        orderBy: { createdAt: "desc" },
        select: ROW_SELECT,
      }),
    ]);

    const newNotifications = sortResolved(
      await resolveAndGroup(unreadRows, seededPaperIds),
      { ...query, sort: "date", dir: "desc" },
    );
    const readGrouped = sortResolved(
      await resolveAndGroup(readRows, seededPaperIds),
      { ...query, sort: "date", dir: "desc" },
    );

    return {
      notifications: [],
      newNotifications,
      oldNotifications: readGrouped.slice(0, query.oldLimit),
      oldTotal: readGrouped.length,
      unreadCount,
    };
  }

  const rows = await prisma.notification.findMany({
    where: { userId, ...tabWhere(query.tab) },
    orderBy:
      query.sort === "type" ? { type: query.dir } : { createdAt: query.dir },
    select: ROW_SELECT,
  });

  const notifications = sortResolved(await resolveAndGroup(rows, seededPaperIds), query);

  return {
    notifications,
    newNotifications: [],
    oldNotifications: [],
    oldTotal: 0,
    unreadCount,
  };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const row = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!row || row.userId !== userId) throw new Error("NOT_FOUND");

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markNotificationsRead(notificationIds: string[], userId: string) {
  if (notificationIds.length === 0) return;
  await prisma.notification.updateMany({
    where: { id: { in: notificationIds }, userId },
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

/** Called after a comment receives a new like. */
export async function createNotificationForCommentLike(input: {
  commentId: string;
  authorId: string;
}) {
  await prisma.notification.create({
    data: {
      userId: input.authorId,
      type: "like",
      referenceId: input.commentId,
      referenceType: "comment",
    },
  });
}
