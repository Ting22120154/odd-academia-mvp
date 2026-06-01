import { prisma } from "@/lib/prisma";
import { createNotificationsForNewComment } from "@/modules/notifications/notification.service";
import type { CommentResponse, CreateCommentRequest, UpdateCommentRequest } from "./types";

type CommentWithAuthor = {
  id: string;
  paperId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; fullName: string; avatarUrl: string | null };
};

type LikeMeta = { likesCount: number; likedByMe: boolean };

function toCommentResponse(
  row: CommentWithAuthor,
  replies: CommentResponse[] = [],
  likeMeta: LikeMeta = { likesCount: 0, likedByMe: false },
): CommentResponse {
  return {
    id: row.id,
    paperId: row.paperId,
    user: {
      id: row.author.id,
      fullName: row.author.fullName,
      avatarUrl: row.author.avatarUrl ?? undefined,
    },
    content: row.content,
    likesCount: likeMeta.likesCount,
    likedByMe: likeMeta.likedByMe,
    replies,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.isHidden ? "REMOVED" : "ACTIVE",
  };
}

async function getLikeMetaByCommentId(
  commentIds: string[],
  viewerId: string | null,
): Promise<Map<string, LikeMeta>> {
  const meta = new Map<string, LikeMeta>();
  if (commentIds.length === 0) return meta;

  const counts = await prisma.commentLike.groupBy({
    by: ["commentId"],
    where: { commentId: { in: commentIds } },
    _count: { commentId: true },
  });

  const likedByViewer = new Set<string>();
  if (viewerId) {
    const mine = await prisma.commentLike.findMany({
      where: { userId: viewerId, commentId: { in: commentIds } },
      select: { commentId: true },
    });
    for (const row of mine) likedByViewer.add(row.commentId);
  }

  for (const id of commentIds) {
    const countRow = counts.find((c) => c.commentId === id);
    meta.set(id, {
      likesCount: countRow?._count.commentId ?? 0,
      likedByMe: likedByViewer.has(id),
    });
  }
  return meta;
}

const authorSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
} as const;

export async function createComment(authorId: string, body: CreateCommentRequest) {
  const paper = await prisma.paper.findUnique({
    where: { id: body.paperId },
    select: { id: true, authorId: true, status: true },
  });
  if (!paper || paper.status === "removed") {
    throw new Error("PAPER_NOT_FOUND");
  }

  if (body.parentCommentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: body.parentCommentId },
      select: { id: true, paperId: true, authorId: true, isHidden: true },
    });
    if (!parent || parent.paperId !== body.paperId || parent.isHidden) {
      throw new Error("PARENT_NOT_FOUND");
    }
  }

  const content = body.content.trim();
  if (!content) throw new Error("CONTENT_REQUIRED");

  const created = await prisma.comment.create({
    data: {
      paperId: body.paperId,
      authorId,
      parentId: body.parentCommentId ?? null,
      content,
    },
    include: { author: { select: authorSelect } },
  });

  try {
    await createNotificationsForNewComment({
      commentId: created.id,
      paperId: created.paperId,
      authorId: created.authorId,
      parentId: created.parentId,
    });
  } catch (e) {
    console.error("[notifications] Failed to create after comment:", e);
  }

  const likeMeta = await getLikeMetaByCommentId([created.id], authorId);
  return toCommentResponse(created, [], likeMeta.get(created.id)!);
}

export async function getCommentsForPaper(paperId: string, viewerId: string | null = null) {
  const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { id: true } });
  if (!paper) throw new Error("PAPER_NOT_FOUND");

  const rows = await prisma.comment.findMany({
    where: { paperId, isHidden: false },
    include: { author: { select: authorSelect } },
    orderBy: { createdAt: "asc" },
  });

  const likeMeta = await getLikeMetaByCommentId(
    rows.map((r) => r.id),
    viewerId,
  );

  const byId = new Map<string, CommentResponse>();
  const roots: CommentResponse[] = [];

  for (const row of rows) {
    byId.set(row.id, toCommentResponse(row, [], likeMeta.get(row.id)!));
  }

  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentId) {
      const parent = byId.get(row.parentId);
      if (parent) parent.replies.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }

  const byNewest = (a: CommentResponse, b: CommentResponse) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  const byOldest = (a: CommentResponse, b: CommentResponse) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  roots.sort(byNewest);
  for (const root of roots) {
    root.replies.sort(byOldest);
  }

  return roots;
}

export async function updateComment(commentId: string, authorId: string, body: UpdateCommentRequest) {
  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existing || existing.isHidden) throw new Error("NOT_FOUND");
  if (existing.authorId !== authorId) throw new Error("FORBIDDEN");

  const content = body.content.trim();
  if (!content) throw new Error("CONTENT_REQUIRED");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { author: { select: authorSelect } },
  });

  const likeMeta = await getLikeMetaByCommentId([updated.id], authorId);
  return toCommentResponse(updated, [], likeMeta.get(updated.id)!);
}

export async function likeComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, isHidden: true },
  });
  if (!comment || comment.isHidden) throw new Error("NOT_FOUND");

  await prisma.commentLike.upsert({
    where: { userId_commentId: { userId, commentId } },
    create: { userId, commentId },
    update: {},
  });

  const meta = await getLikeMetaByCommentId([commentId], userId);
  return { commentId, liked: true, likesCount: meta.get(commentId)!.likesCount };
}

export async function unlikeComment(commentId: string, userId: string) {
  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
  if (!existing) throw new Error("NOT_LIKED");

  await prisma.commentLike.delete({
    where: { userId_commentId: { userId, commentId } },
  });

  const meta = await getLikeMetaByCommentId([commentId], userId);
  return { commentId, liked: false, likesCount: meta.get(commentId)!.likesCount };
}

export async function deleteComment(commentId: string, authorId: string) {
  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existing || existing.isHidden) throw new Error("NOT_FOUND");
  if (existing.authorId !== authorId) throw new Error("FORBIDDEN");

  await prisma.comment.update({
    where: { id: commentId },
    data: { isHidden: true },
  });
}
