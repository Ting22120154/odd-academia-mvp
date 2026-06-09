import { NextRequest } from "next/server";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminUserFromPayload } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const paper = await prisma.paper.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      categories: true,
      _count: { select: { comments: true, followers: true } },
    },
  });

  if (!paper) return err("Paper not found.", 404);

  const when = paper.publishedAt ?? paper.createdAt;

  return ok({
    id: paper.id,
    title: paper.title,
    abstract: paper.abstract,
    status: paper.status,
    author: paper.author.fullName,
    authorId: paper.author.id,
    category: paper.categories[0]?.category ?? "—",
    published: when.toISOString(),
    views: paper.viewCount,
    cited: paper.citationCount,
    downloaded: 0,
    comments: paper._count.comments,
    followers: paper._count.followers,
    fileUrl: paper.fileUrl,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { payload } = auth;

  const { id } = await params;

  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) return err("Paper not found.", 404);

  const adminUser = await getAdminUserFromPayload(payload);
  if (!adminUser) return err("Admin user not found.", 403);

  const [updated] = await prisma.$transaction([
    prisma.paper.update({ where: { id }, data: { status: "removed" } }),
    prisma.moderationLog.create({
      data: { adminId: adminUser.userId, action: "remove_paper", targetId: id, targetType: "paper" },
    }),
  ]);

  return ok(updated);
}
