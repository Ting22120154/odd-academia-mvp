import prisma from "@odd-academia/db/client";
import { paperInclude } from "@/lib/papers/constants";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.paper.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing || existing.status === "removed" || existing.status !== "published") {
      return Response.json({ error: "Paper not found" }, { status: 404 });
    }

    const paper = await prisma.paper.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: paperInclude,
    });

    return Response.json(paper);
  } catch (error) {
    console.error("GET /api/papers/[id] failed:", error);
    return Response.json(
      { error: "Failed to fetch paper" },
      { status: 500 },
    );
  }
}
