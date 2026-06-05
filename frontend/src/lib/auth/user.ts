/**
 * Maps Prisma User rows to safe API shapes (never exposes passwordHash).
 */
import type { User } from "@prisma/client";
import type { ApiRole, PublicUser } from "@/lib/auth/types";

export function toApiRole(role: User["role"]): ApiRole {
  return role === "admin" ? "ADMIN" : "USER";
}

export function resolveAvatarUrl(
  userId: string,
  avatarUrl: string | null | undefined,
): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith("/api/users/")) return avatarUrl;
  if (avatarUrl.includes("blob.vercel-storage.com") || avatarUrl.startsWith("/uploads/")) {
    return `/api/users/${userId}/avatar`;
  }
  return avatarUrl;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    avatarUrl: resolveAvatarUrl(user.id, user.avatarUrl),
    role: toApiRole(user.role),
  };
}
