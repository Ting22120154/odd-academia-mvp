import { revalidatePath } from "next/cache";
import prisma from "@odd-academia/db/client";
import { getRouteUserId } from "@/lib/auth/require-auth";

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

function parsePublishedAt(value: string | undefined): Date | undefined | null {
  if (value === undefined) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const post = await prisma.paper.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: paperInclude,
    });

    return Response.json(post);
  } catch (error) {
    console.error("GET /api/posts/[id] failed:", error);
    return Response.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRouteUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.paper.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }
  if (existing.authorId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const keywords = Array.isArray(b.keywords)
    ? (b.keywords.filter((x) => typeof x === "string") as string[])
    : undefined;
  const categories = Array.isArray(b.categories)
    ? (b.categories.filter((x) => typeof x === "string") as string[])
    : undefined;
  const references = Array.isArray(b.references)
    ? (b.references.filter((x) => typeof x === "string") as string[])
    : undefined;
  const contributors = Array.isArray(b.contributors)
    ? (b.contributors.filter(
        (x) =>
          x &&
          typeof x === "object" &&
          typeof (x as { label?: unknown }).label === "string",
      ) as { label: string; href?: string }[])
    : undefined;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (keywords !== undefined) {
        await tx.paperKeyword.deleteMany({ where: { paperId: id } });
        if (keywords.length > 0) {
          await tx.paperKeyword.createMany({
            data: keywords.map((keyword) => ({ paperId: id, keyword })),
          });
        }
      }

      if (categories !== undefined) {
        await tx.paperCategory.deleteMany({ where: { paperId: id } });
        if (categories.length > 0) {
          await tx.paperCategory.createMany({
            data: categories.map((category) => ({ paperId: id, category })),
          });
        }
      }

      if (contributors !== undefined) {
        await tx.paperContributor.deleteMany({ where: { paperId: id } });
        if (contributors.length > 0) {
          await tx.paperContributor.createMany({
            data: contributors.map((c) => ({
              paperId: id,
              contributorName: c.label.trim(),
            })),
          });
        }
      }

      if (references !== undefined) {
        await tx.paperReference.deleteMany({ where: { paperId: id } });
        if (references.length > 0) {
          await tx.paperReference.createMany({
            data: references.map((citationText) => ({
              paperId: id,
              citationText,
            })),
          });
        }
      }

      const data: {
        title?: string;
        abstract?: string | null;
        publishedAt?: Date | null;
        doi?: string | null;
      } = {};

      if (typeof b.title === "string") data.title = b.title.trim();
      if (typeof b.content === "string") data.abstract = b.content.trim() || null;
      if (typeof b.doi === "string") data.doi = b.doi.trim() || null;
      if (typeof b.publishedDate === "string") {
        data.publishedAt = parsePublishedAt(b.publishedDate) ?? null;
      }

      return tx.paper.update({
        where: { id },
        data,
        include: paperInclude,
      });
    });

    revalidatePath(`/posts/${id}`);
    revalidatePath(`/posts/${id}/edit`);
    revalidatePath(`/`);
    return Response.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 400 });
  }
}
