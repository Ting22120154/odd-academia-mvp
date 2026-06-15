import path from "path";
import { deleteBlob } from "@/lib/storage/blob";

export const AVATAR_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const AVATAR_EXTENSIONS = ["jpg", "png", "webp"] as const;

export function avatarBlobPath(userId: string, ext: string) {
  const normalized = ext === "jpeg" ? "jpg" : ext;
  return `avatars/${userId}.${normalized}`;
}

export function avatarApiUrl(userId: string) {
  return `/api/users/${userId}/avatar`;
}

export function avatarDiskPath(userId: string, ext = "jpg") {
  return path.join(process.cwd(), "public", "uploads", "avatars", `${userId}.${ext}`);
}

export function avatarPublicUrl(userId: string, ext = "jpg") {
  return `/uploads/avatars/${userId}.${ext}`;
}

export async function deleteStoredAvatarBlobs(userId: string) {
  for (const ext of AVATAR_EXTENSIONS) {
    try {
      await deleteBlob(avatarBlobPath(userId, ext));
    } catch {
      // file may not exist
    }
  }
}
