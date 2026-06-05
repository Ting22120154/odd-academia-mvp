import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { fetchBlobBuffer, isBlobUrl } from "@/lib/storage/blob";

function localAvatarPath(userId: string) {
  return path.join(process.cwd(), "public", "uploads", "avatars", `${userId}.jpg`);
}

/** GET /api/users/:id/avatar — serve avatar (local disk or private Blob) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { avatarUrl: true },
  });

  if (!user?.avatarUrl) {
    return new Response("Not found", { status: 404 });
  }

  try {
    if (isBlobUrl(user.avatarUrl) || user.avatarUrl.startsWith("/api/users/")) {
      const { buffer, contentType } = await fetchBlobBuffer(`avatars/${id}.jpg`);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (user.avatarUrl.startsWith("/uploads/avatars/")) {
      const buffer = await readFile(localAvatarPath(id));
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return Response.redirect(user.avatarUrl, 302);
  } catch (error) {
    console.error("GET /api/users/[id]/avatar failed:", error);
    return new Response("Not found", { status: 404 });
  }
}
