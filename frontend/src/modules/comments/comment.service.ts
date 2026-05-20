import { prisma } from "@/lib/prisma";
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

function toCommentResponse(row: CommentWithAuthor, replies: CommentResponse[] = []): CommentResponse {
  return {
    id: row.id,
    paperId: row.paperId,
    user: {
      id: row.author.id,
      fullName: row.author.fullName,
      avatarUrl: row.author.avatarUrl ?? undefined,
    },
    content: row.content,
    likesCount: 0, // no CommentLike table in schema yet — always 0 until DB lead adds it
    replies,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.isHidden ? "REMOVED" : "ACTIVE",
  };
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

  return toCommentResponse(created, []);
}

export async function getCommentsForPaper(paperId: string) {
  const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { id: true } });
  if (!paper) throw new Error("PAPER_NOT_FOUND");

  const rows = await prisma.comment.findMany({
    where: { paperId, isHidden: false },
    include: { author: { select: authorSelect } },
    orderBy: { createdAt: "asc" },
  });

  const byId = new Map<string, CommentResponse>();
  const roots: CommentResponse[] = [];

  for (const row of rows) {
    byId.set(row.id, toCommentResponse(row, []));
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

  return toCommentResponse(updated, []);
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
