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
  actorId: string | null;
  body: string | null;
  isRead: boolean;
  createdAt: Date;
};

const ROW_SELECT = {
  id: true,
  type: true,
  referenceId: true,
  referenceType: true,
  actorId: true,
  body: true,
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
      return "Message";
    case "citation":
      return "Citation";
    case "follow":
      return "Follow";
    case "moderation":
      return "Moderation";
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
  if (tab === "moderation") return { type: "moderation" as const };
  return {};
}

type CommentMeta = {
  paperId: string;
  parentId: string | null;
  isHidden: boolean;
  authorId: string;
};

async function loadCommentLookup(rows: NotificationRow[]): Promise<Map<string, CommentMeta>> {
  const commentIds = new Set<string>();
  for (const row of rows) {
    if (row.referenceType === "comment" && row.referenceId) {
      commentIds.add(row.referenceId);
    }
  }
  if (commentIds.size === 0) return new Map();

  const comments = await prisma.comment.findMany({
    where: { id: { in: [...commentIds] } },
    select: { id: true, paperId: true, parentId: true, isHidden: true, authorId: true },
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

async function loadUserNames(userIds: Set<string>): Promise<Map<string, string>> {
  if (userIds.size === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, fullName: true },
  });
  return new Map(users.map((u) => [u.id, u.fullName]));
}

async function loadLikerFallback(rows: NotificationRow[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const needs = rows.filter(
    (r) => r.type === "like" && !r.actorId && r.referenceType === "comment" && r.referenceId,
  );
  if (needs.length === 0) return out;

  const commentIds = [...new Set(needs.map((r) => r.referenceId!))];
  const likes = await prisma.commentLike.findMany({
    where: { commentId: { in: commentIds } },
    select: { commentId: true, userId: true, createdAt: true },
  });

  const likesByComment = new Map<string, typeof likes>();
  for (const like of likes) {
    const list = likesByComment.get(like.commentId) ?? [];
    list.push(like);
    likesByComment.set(like.commentId, list);
  }

  for (const row of needs) {
    const candidates = likesByComment.get(row.referenceId!) ?? [];
    if (candidates.length === 0) continue;
    if (candidates.length === 1) {
      out.set(row.id, candidates[0].userId);
      continue;
    }
    let best = candidates[0];
    let bestDiff = Math.abs(best.createdAt.getTime() - row.createdAt.getTime());
    for (const candidate of candidates.slice(1)) {
      const diff = Math.abs(candidate.createdAt.getTime() - row.createdAt.getTime());
      if (diff < bestDiff) {
        best = candidate;
        bestDiff = diff;
      }
    }
    out.set(row.id, best.userId);
  }
  return out;
}

function collectUserIds(
  rows: NotificationRow[],
  commentById: Map<string, CommentMeta>,
  likerByNotificationId: Map<string, string>,
): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    const actorId = resolveActorId(row, commentById, likerByNotificationId);
    if (actorId) ids.add(actorId);
    if (row.referenceType === "user" && row.referenceId) ids.add(row.referenceId);
  }
  return ids;
}

function userName(userMap: Map<string, string>, userId: string | null | undefined): string {
  if (!userId) return "Someone";
  return userMap.get(userId) ?? "Someone";
}

/** Old rows may lack actorId; infer from comment author or nearest like record. */
function resolveActorId(
  row: NotificationRow,
  commentById: Map<string, CommentMeta>,
  likerByNotificationId: Map<string, string>,
): string | null {
  if (row.actorId) return row.actorId;
  if (row.type === "like") return likerByNotificationId.get(row.id) ?? null;
  if (
    row.referenceType === "comment" &&
    row.referenceId &&
    (row.type === "comment" || row.type === "reply")
  ) {
    return commentById.get(row.referenceId)?.authorId ?? null;
  }
  return null;
}

function resolvePaperIdForRow(row: NotificationRow, commentById: Map<string, CommentMeta>): string | null {
  if (row.referenceType === "paper" && row.referenceId) return row.referenceId;
  if (row.referenceType === "comment" && row.referenceId) {
    return commentById.get(row.referenceId)?.paperId ?? null;
  }
  return null;
}

function paperTitleForId(paperId: string, titleByPaperId: Map<string, string>): string {
  return titleByPaperId.get(paperId) ?? "your paper";
}

function resolveOne(
  row: NotificationRow,
  seededPaperIds: string[],
  commentById: Map<string, CommentMeta>,
  titleByPaperId: Map<string, string>,
  userMap: Map<string, string>,
  likerByNotificationId: Map<string, string>,
): ResolvedNotification {
  const paperId = resolvePaperIdForRow(row, commentById);
  const paperTitle = paperId ? paperTitleForId(paperId, titleByPaperId) : null;
  const actor = userName(userMap, resolveActorId(row, commentById, likerByNotificationId));

  let text = "New notification";
  let href = "/notifications";

  if (row.type === "paper" && row.referenceType === "paper" && row.referenceId) {
    text = `New paper published: ${paperTitleForId(row.referenceId, titleByPaperId)}`;
    href = paperPathForId(row.referenceId, seededPaperIds);
  } else if (row.type === "comment" && row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment) {
      text = `${actor} commented on your paper: ${paperTitleForId(comment.paperId, titleByPaperId)}`;
      href = paperCommentHref(
        comment.paperId,
        comment.isHidden ? null : row.referenceId,
        seededPaperIds,
      );
    }
  } else if (row.type === "comment" && row.referenceType === "paper" && row.referenceId) {
    text = `${actor} commented on your paper: ${paperTitleForId(row.referenceId, titleByPaperId)}`;
    href = paperPathForId(row.referenceId, seededPaperIds);
  } else if (row.type === "reply" && row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment) {
      const anchor = comment.parentId ?? row.referenceId;
      const anchorId = comment.isHidden && comment.parentId ? comment.parentId : anchor;
      text = `${actor} replied to your comment on ${paperTitleForId(comment.paperId, titleByPaperId)}`;
      href = paperCommentHref(
        comment.paperId,
        comment.isHidden && !comment.parentId ? null : anchorId,
        seededPaperIds,
      );
    } else {
      text = `${actor} replied to your comment`;
    }
  } else if (row.type === "like" && row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment) {
      text = `${actor} liked your comment on ${paperTitleForId(comment.paperId, titleByPaperId)}`;
      href = paperCommentHref(
        comment.paperId,
        comment.isHidden ? null : row.referenceId,
        seededPaperIds,
      );
    } else {
      text = `${actor} liked your comment`;
    }
  } else if (row.type === "citation") {
    text = "Your work was cited";
    if (row.referenceType === "paper" && row.referenceId) {
      text = `Your work was cited: ${titleByPaperId.get(row.referenceId) ?? "your paper"}`;
      href = paperPathForId(row.referenceId, seededPaperIds);
    }
  } else if (row.type === "contact" && row.referenceType === "user" && row.referenceId) {
    text = `${userName(userMap, row.referenceId)} sent you a message`;
    href = `/user/${row.referenceId}?chat=1`;
  } else if (row.type === "contact") {
    text = `${actor} sent you a message`;
  } else if (row.type === "follow" && row.referenceType === "user" && row.referenceId) {
    text = `${userName(userMap, row.referenceId)} started following you`;
    href = `/user/${row.referenceId}`;
  } else if (row.type === "follow" && row.referenceType === "paper" && row.referenceId) {
    text = `${actor} followed your paper: ${titleByPaperId.get(row.referenceId) ?? "your paper"}`;
    href = paperPathForId(row.referenceId, seededPaperIds);
  } else if (row.type === "moderation") {
    text = row.body ?? "Moderation update";
    if (row.referenceType === "paper" && row.referenceId) {
      href = paperPathForId(row.referenceId, seededPaperIds);
    } else if (row.referenceType === "user" && row.referenceId) {
      href = `/user/${row.referenceId}`;
    } else if (row.referenceType === "comment" && row.referenceId) {
      const comment = commentById.get(row.referenceId);
      if (comment) {
        href = paperCommentHref(
          comment.paperId,
          comment.isHidden ? null : row.referenceId,
          seededPaperIds,
        );
      }
    }
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
    if (row.type === "follow" && row.referenceType === "paper" && row.referenceId) {
      paperIds.add(row.referenceId);
    }
  }
  const titleByPaperId = await loadPaperTitles(paperIds);
  const likerByNotificationId = await loadLikerFallback(rows);
  const userMap = await loadUserNames(collectUserIds(rows, commentById, likerByNotificationId));
  const resolved = rows.map((row) =>
    resolveOne(row, seededPaperIds, commentById, titleByPaperId, userMap, likerByNotificationId),
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
          actorId: input.authorId,
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
        actorId: input.authorId,
      },
    });
  }
}

/** Called after a comment receives a new like. */
export async function createNotificationForCommentLike(input: {
  commentId: string;
  authorId: string;
  likerId: string;
}) {
  await prisma.notification.create({
    data: {
      userId: input.authorId,
      type: "like",
      referenceId: input.commentId,
      referenceType: "comment",
      actorId: input.likerId,
    },
  });
}
