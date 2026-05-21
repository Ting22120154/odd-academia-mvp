import prisma from "../../../../../../packages/db/src/client";

const paperInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
    },
  },
  keywords: true,
  categories: true,
  contributors: true,
  references: true,
} as const;

function parseLimit(value: string | null): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(50, n);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams.get("limit"));

    const posts = await prisma.paper.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: paperInclude,
    });

    return Response.json({ posts });
  } catch (error) {
    console.error("GET /api/papers/latest failed:", error);
    return Response.json(
      { error: "Failed to fetch latest papers" },
      { status: 500 },
    );
  }
}
