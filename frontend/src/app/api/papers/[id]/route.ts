import prisma from "@odd-academia/db/client";
import { getRouteUserId } from "@/lib/auth/require-auth";
import { paperInclude } from "@/lib/papers/constants";
import { recordUniquePaperView } from "@/lib/papers/record-view";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.paper.findUnique({
      where: { id },
      select: { id: true, status: true, authorId: true },
    });

    if (!existing || existing.status === "removed" || existing.status !== "published") {
      return Response.json({ error: "Paper not found" }, { status: 404 });
    }

    const viewerId = await getRouteUserId(req);
    if (viewerId) {
      await recordUniquePaperView(id, viewerId, existing.authorId);
    }

    const paper = await prisma.paper.findUnique({
      where: { id },
      include: paperInclude,
    });

    if (!paper) {
      return Response.json({ error: "Paper not found" }, { status: 404 });
    }

    return Response.json(paper);
  } catch (error) {
    console.error("GET /api/papers/[id] failed:", error);
    return Response.json(
      { error: "Failed to fetch paper" },
      { status: 500 },
    );
  }
}
