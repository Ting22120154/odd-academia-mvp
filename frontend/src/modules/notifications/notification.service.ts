import type { NotificationType, ReferenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
  actorId: string | null;
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
      return "Follow";
    default:
      return "Comment";
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function paperCommentHref(paperId: string, commentId: string | null): string {
  return commentId ? `/paper/${paperId}#comment-${commentId}` : `/paper/${paperId}`;
}

function toNotificationResponse(
  row: NotificationRow,
  paperMap: Map<string, string>,
  commentMap: Map<string, string>,
  userMap: Map<string, string>,
): NotificationResponse {
  let text = "New notification";
  let href = "/notifications";

  if (row.type === "paper" && row.referenceType === "paper" && row.referenceId) {
    const title = paperMap.get(row.referenceId) ?? "your paper";
    text = `Update on your paper: ${title}`;
    href = `/paper/${row.referenceId}`;
  } else if (row.type === "comment" && row.referenceType === "comment" && row.referenceId) {
    const paperId = commentMap.get(row.referenceId);
    if (paperId) {
      const title = paperMap.get(paperId) ?? "your paper";
      text = `New comment on your paper: ${title}`;
      href = paperCommentHref(paperId, row.referenceId);
    }
  } else if (row.type === "comment" && row.referenceType === "paper" && row.referenceId) {
    const title = paperMap.get(row.referenceId) ?? "your paper";
    text = `New comment on your paper: ${title}`;
    href = `/paper/${row.referenceId}`;
  } else if (row.type === "reply" && row.referenceType === "comment" && row.referenceId) {
    const paperId = commentMap.get(row.referenceId);
    if (paperId) {
      const title = paperMap.get(paperId) ?? "your paper";
      text = `New reply to your comment on ${title}`;
      href = paperCommentHref(paperId, row.referenceId);
    } else {
      text = "New reply to your comment";
    }
  } else if (row.type === "citation") {
    text = "Your work was cited";
    if (row.referenceType === "paper" && row.referenceId) {
      const title = paperMap.get(row.referenceId) ?? "your paper";
      text = `Your work was cited: ${title}`;
      href = `/paper/${row.referenceId}`;
    }
  } else if (row.type === "contact") {
    text = "Someone contacted you — check your email";
    href = "/notifications";
  } else if (row.type === "follow" && row.referenceType === "user" && row.referenceId) {
    const name = userMap.get(row.referenceId) ?? "Someone";
    text = `${name} started following you`;
    href = `/user/${row.referenceId}`;
  } else if (row.type === "follow" && row.referenceType === "paper" && row.referenceId) {
    const title = paperMap.get(row.referenceId) ?? "your paper";
    const actor = row.actorId ? (userMap.get(row.actorId) ?? "Someone") : "Someone";
    text = `${actor} followed your paper: ${title}`;
    href = `/paper/${row.referenceId}`;
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
      actorId: true,
      isRead: true,
      createdAt: true,
    },
  });

  // Collect unique IDs for batch lookups
  const paperRefIds = new Set<string>();
  const commentRefIds = new Set<string>();
  const userRefIds = new Set<string>();

  for (const row of rows) {
    if (row.actorId) userRefIds.add(row.actorId);
    if (!row.referenceId) continue;
    if (row.referenceType === "paper") paperRefIds.add(row.referenceId);
    if (row.referenceType === "comment") commentRefIds.add(row.referenceId);
    if (row.referenceType === "user") userRefIds.add(row.referenceId);
  }

  // Batch: three bulk DB calls + unread count, all in parallel
  const [papers, comments, actors, unreadCount] = await Promise.all([
    paperRefIds.size > 0
      ? prisma.paper.findMany({
          where: { id: { in: [...paperRefIds] } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    commentRefIds.size > 0
      ? prisma.comment.findMany({
          where: { id: { in: [...commentRefIds] } },
          select: { id: true, paperId: true, isHidden: true },
        })
      : Promise.resolve([]),
    userRefIds.size > 0
      ? prisma.user.findMany({
          where: { id: { in: [...userRefIds] } },
          select: { id: true, fullName: true },
        })
      : Promise.resolve([]),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const paperMap = new Map(papers.map((p) => [p.id, p.title]));
  const userMap = new Map(actors.map((u) => [u.id, u.fullName]));

  // Comment map: commentId → paperId (hidden comments are excluded)
  const commentMap = new Map(
    comments.filter((c) => !c.isHidden).map((c) => [c.id, c.paperId]),
  );

  // For comment-referenced notifications that link to a paper via the comment,
  // also need those paper titles — collect and batch-fetch any missing ones
  const extraPaperIds = new Set<string>();
  for (const c of comments) {
    if (!c.isHidden && !paperMap.has(c.paperId)) extraPaperIds.add(c.paperId);
  }

  if (extraPaperIds.size > 0) {
    const extraPapers = await prisma.paper.findMany({
      where: { id: { in: [...extraPaperIds] } },
      select: { id: true, title: true },
    });
    for (const p of extraPapers) paperMap.set(p.id, p.title);
  }

  const notifications = rows.map((row) =>
    toNotificationResponse(row, paperMap, commentMap, userMap),
  );

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
