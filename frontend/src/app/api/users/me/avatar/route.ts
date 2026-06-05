import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { ok, err } from "@/lib/response";
import { deleteBlob, isBlobUrl, uploadBlob, useBlobStorage } from "@/lib/storage/blob";

function avatarApiUrl(userId: string) {
  return `/api/users/${userId}/avatar`;
}

function avatarBlobPath(userId: string) {
  return `avatars/${userId}.jpg`;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = "image/jpeg";
const ALLOWED_EXT = new Set([".jpg", ".jpeg"]);

function avatarDiskPath(userId: string) {
  return path.join(process.cwd(), "public", "uploads", "avatars", `${userId}.jpg`);
}

function avatarPublicUrl(userId: string) {
  return `/uploads/avatars/${userId}.jpg`;
}

export async function POST(req: Request) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return err("Could not read upload.", 400);
  }

  const fileField = formData.get("file");
  if (!fileField || typeof fileField === "string") {
    return err("Missing required field: file", 400);
  }

  const file = fileField as File;
  if (file.size > MAX_BYTES) {
    return err("File too large. Max size is 2MB.", 400);
  }

  const nameExt = path.extname(file.name).toLowerCase();
  if (nameExt && !ALLOWED_EXT.has(nameExt)) {
    return err("Only .jpg and .jpeg images are allowed.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || detected.mime !== ALLOWED_MIME) {
    return err("Only JPEG images are allowed.", 400);
  }

  const declaredType = file.type?.trim();
  if (declaredType && declaredType !== ALLOWED_MIME) {
    return err("Only JPEG images are allowed.", 400);
  }

  const userId = auth.payload.sub;
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  let avatarUrl: string;
  if (useBlobStorage()) {
    try {
      if (existing?.avatarUrl && isBlobUrl(existing.avatarUrl)) {
        await deleteBlob(existing.avatarUrl);
      } else {
        await deleteBlob(avatarBlobPath(userId));
      }
    } catch {
      // blob may not exist yet
    }
    await uploadBlob(avatarBlobPath(userId), buffer, ALLOWED_MIME);
    avatarUrl = avatarApiUrl(userId);
  } else {
    const diskPath = avatarDiskPath(userId);
    await mkdir(path.dirname(diskPath), { recursive: true });
    await writeFile(diskPath, buffer);
    avatarUrl = avatarPublicUrl(userId);
  }
  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  return ok({ avatarUrl });
}

export async function DELETE() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const userId = auth.payload.sub;
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (useBlobStorage()) {
    try {
      if (existing?.avatarUrl && isBlobUrl(existing.avatarUrl)) {
        await deleteBlob(existing.avatarUrl);
      } else {
        await deleteBlob(avatarBlobPath(userId));
      }
    } catch {
      // ignore
    }
  } else {
    const diskPath = avatarDiskPath(userId);
    try {
      await unlink(diskPath);
    } catch {
      // file may not exist
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  });

  return ok({ avatarUrl: null });
}
