import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import {
  AVATAR_EXTENSIONS,
  avatarDiskPath,
  avatarBlobPath,
} from "@/lib/auth/avatar-storage";
import { fetchBlobBuffer, isBlobUrl } from "@/lib/storage/blob";

async function loadAvatarBlob(userId: string) {
  for (const ext of AVATAR_EXTENSIONS) {
    try {
      return await fetchBlobBuffer(avatarBlobPath(userId, ext));
    } catch {
      // try next extension
    }
  }
  throw new Error("Avatar blob not found");
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
      const { buffer, contentType } = await loadAvatarBlob(id);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (user.avatarUrl.startsWith("/uploads/avatars/")) {
      for (const ext of AVATAR_EXTENSIONS) {
        try {
          const buffer = await readFile(avatarDiskPath(id, ext));
          const contentType =
            ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          return new Response(new Uint8Array(buffer), {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "private, max-age=3600",
            },
          });
        } catch {
          // try next extension
        }
      }
      return new Response("Not found", { status: 404 });
    }

    return Response.redirect(user.avatarUrl, 302);
  } catch (error) {
    console.error("GET /api/users/[id]/avatar failed:", error);
    return new Response("Not found", { status: 404 });
  }
}
