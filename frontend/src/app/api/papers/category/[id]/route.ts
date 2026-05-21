import prisma from "../../../../../../../packages/db/src/client";

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

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const category = decodeURIComponent(id).trim();

    if (!category) {
      return Response.json({ error: "Missing category" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      50,
      parsePositiveInt(searchParams.get("limit"), 10),
    );
    const skip = (page - 1) * limit;

    const where = {
      status: "published" as const,
      categories: { some: { category } },
    };

    const [posts, total] = await Promise.all([
      prisma.paper.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: paperInclude,
      }),
      prisma.paper.count({ where }),
    ]);

    return Response.json({ posts, total, page, limit, category });
  } catch (error) {
    console.error("GET /api/papers/category/[id] failed:", error);
    return Response.json(
      { error: "Failed to fetch papers by category" },
      { status: 500 },
    );
  }
}
