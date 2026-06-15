import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { ok, err } from "@/lib/response";
import {
  AVATAR_MIME_TO_EXT,
  avatarApiUrl,
  avatarDiskPath,
  avatarBlobPath,
  avatarPublicUrl,
  deleteStoredAvatarBlobs,
} from "@/lib/auth/avatar-storage";
import { deleteBlob, isBlobUrl, uploadBlob, useBlobStorage } from "@/lib/storage/blob";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIMES = new Set(Object.keys(AVATAR_MIME_TO_EXT));

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
    return err("Only JPEG, PNG, or WebP images are allowed.", 400);
  }

  const ext = AVATAR_MIME_TO_EXT[detected.mime]!;
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
      }
    } catch {
      // ignore
    }
    await deleteStoredAvatarBlobs(userId);
    await uploadBlob(avatarBlobPath(userId, ext), buffer, detected.mime);
    avatarUrl = avatarApiUrl(userId);
  } else {
    const diskPath = avatarDiskPath(userId, ext);
    await mkdir(path.dirname(diskPath), { recursive: true });
    for (const oldExt of ["jpg", "png", "webp"]) {
      try {
        await unlink(avatarDiskPath(userId, oldExt));
      } catch {
        // ignore
      }
    }
    await writeFile(diskPath, buffer);
    avatarUrl = avatarPublicUrl(userId, ext);
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
      }
    } catch {
      // ignore
    }
    await deleteStoredAvatarBlobs(userId);
  } else {
    for (const ext of ["jpg", "png", "webp"]) {
      try {
        await unlink(avatarDiskPath(userId, ext));
      } catch {
        // ignore
      }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  });

  return ok({ avatarUrl: null });
}
