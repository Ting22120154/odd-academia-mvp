import jwt from "jsonwebtoken";
import prisma from "@odd-academia/db/client";

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

function getBearerUserId(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload & {
      userId?: string;
    };
    if (typeof payload.userId === "string") return payload.userId;
    if (typeof payload.sub === "string") return payload.sub;
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 10);
  const search = searchParams.get("search")?.trim() || undefined;
  const skip = (page - 1) * limit;

  const where = {
    status: "published" as const,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { abstract: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: paperInclude,
    }),
    prisma.paper.count({ where }),
  ]);

  return Response.json({ posts, total, page, limit });
}

export async function POST(req: Request) {
  const userId = getBearerUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (typeof b.title !== "string" || !b.title.trim()) {
    return Response.json({ error: "Missing required field: title" }, { status: 400 });
  }

  const content = typeof b.content === "string" ? b.content : "";
  const keywords = Array.isArray(b.keywords)
    ? (b.keywords.filter((x) => typeof x === "string") as string[])
    : [];
  const categories = Array.isArray(b.categories)
    ? (b.categories.filter((x) => typeof x === "string") as string[])
    : [];
  const publishedDate =
    typeof b.publishedDate === "string" ? b.publishedDate : undefined;
  const doi = typeof b.doi === "string" ? b.doi.trim() || undefined : undefined;
  const references = Array.isArray(b.references)
    ? (b.references.filter((x) => typeof x === "string") as string[])
    : [];
  const contributors = Array.isArray(b.contributors)
    ? (b.contributors.filter(
        (x) =>
          x &&
          typeof x === "object" &&
          typeof (x as { label?: unknown }).label === "string",
      ) as { label: string; href?: string }[])
    : [];

  let publishedAt: Date | undefined;
  if (publishedDate) {
    const parsed = new Date(publishedDate);
    if (!Number.isNaN(parsed.getTime())) publishedAt = parsed;
  }

  const paper = await prisma.paper.create({
    data: {
      authorId: userId,
      title: b.title.trim(),
      abstract: content.trim() || null,
      publishedAt,
      doi,
      keywords: {
        create: keywords.map((keyword) => ({ keyword })),
      },
      categories: {
        create: categories.map((category) => ({ category })),
      },
      contributors: {
        create: contributors.map((c) => ({
          contributorName: c.label.trim(),
        })),
      },
      references: {
        create: references.map((citationText) => ({ citationText })),
      },
    },
    include: paperInclude,
  });

  return Response.json(paper, { status: 201 });
}
