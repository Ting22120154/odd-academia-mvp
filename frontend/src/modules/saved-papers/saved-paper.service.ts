import { prisma } from "@/lib/prisma";
import {
  getSeededPaperIds,
  paperIdToRouteId,
} from "@/modules/papers/paper-route.service";
import type { SavedPaperResponse, SaveStatusResponse } from "./types";

const authorSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
} as const;

const paperSelect = {
  id: true,
  title: true,
  abstract: true,
  status: true,
  author: { select: authorSelect },
} as const;

function assertPaperExists(
  paper: { id: string; status: string } | null,
): asserts paper is { id: string; status: string } {
  if (!paper || paper.status === "removed") {
    throw new Error("PAPER_NOT_FOUND");
  }
}

function toSavedPaperResponse(
  row: {
    createdAt: Date;
    paper: {
      id: string;
      title: string;
      abstract: string | null;
      author: { id: string; fullName: string; avatarUrl: string | null };
    };
  },
  seededIds: string[],
): SavedPaperResponse {
  const routeId = paperIdToRouteId(row.paper.id, seededIds) ?? undefined;
  return {
    paperId: row.paper.id,
    routeId,
    title: row.paper.title,
    abstract: row.paper.abstract ?? undefined,
    author: {
      id: row.paper.author.id,
      fullName: row.paper.author.fullName,
      avatarUrl: row.paper.author.avatarUrl ?? undefined,
    },
    savedAt: row.createdAt.toISOString(),
  };
}

export async function savePaper(userId: string, paperId: string): Promise<SaveStatusResponse> {
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    select: { id: true, status: true, authorId: true },
  });
  assertPaperExists(paper);

  const alreadySaved = await prisma.paperSave.findUnique({
    where: { userId_paperId: { userId, paperId } },
    select: { userId: true },
  });

  await prisma.paperSave.upsert({
    where: { userId_paperId: { userId, paperId } },
    create: { userId, paperId },
    update: {},
  });

  if (!alreadySaved && paper.authorId !== userId) {
    await prisma.notification.create({
      data: {
        userId: paper.authorId,
        type: "paper",
        referenceId: paperId,
        referenceType: "paper",
        actorId: userId,
      },
    }).catch((e) => console.error("[save paper] notification failed:", e));
  }

  return { paperId, saved: true };
}

export async function unsavePaper(userId: string, paperId: string): Promise<SaveStatusResponse> {
  const existing = await prisma.paperSave.findUnique({
    where: { userId_paperId: { userId, paperId } },
  });
  if (!existing) throw new Error("NOT_SAVED");

  await prisma.paperSave.delete({
    where: { userId_paperId: { userId, paperId } },
  });

  return { paperId, saved: false };
}

export async function getSaveStatus(userId: string, paperId: string): Promise<SaveStatusResponse> {
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    select: { id: true, status: true },
  });
  assertPaperExists(paper);

  const row = await prisma.paperSave.findUnique({
    where: { userId_paperId: { userId, paperId } },
    select: { paperId: true },
  });

  return { paperId, saved: Boolean(row) };
}

export async function listSavedPapers(userId: string): Promise<SavedPaperResponse[]> {
  const [rows, seededIds] = await Promise.all([
    prisma.paperSave.findMany({
      where: {
        userId,
        paper: { status: { not: "removed" } },
      },
      include: { paper: { select: paperSelect } },
      orderBy: { createdAt: "desc" },
    }),
    getSeededPaperIds(),
  ]);

  return rows.map((row) => toSavedPaperResponse(row, seededIds));
}

export async function countSavedPapers(userId: string): Promise<number> {
  return prisma.paperSave.count({
    where: {
      userId,
      paper: { status: { not: "removed" } },
    },
  });
}
