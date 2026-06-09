import prisma from "@odd-academia/db/client";
import { Prisma } from "@prisma/client";

/** Count one view per logged-in user; skips author self-views. */
export async function recordUniquePaperView(
  paperId: string,
  userId: string,
  authorId: string,
): Promise<void> {
  if (userId === authorId) return;

  try {
    await prisma.paperView.create({ data: { paperId, userId } });
    await prisma.paper.update({
      where: { id: paperId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return;
    }
    throw e;
  }
}
