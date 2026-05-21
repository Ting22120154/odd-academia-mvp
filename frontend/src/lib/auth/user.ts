import type { User } from "@prisma/client";
import type { ApiRole, PublicUser } from "@/lib/auth/types";

export function toApiRole(role: User["role"]): ApiRole {
  return role === "admin" ? "ADMIN" : "USER";
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl ?? undefined,
    role: toApiRole(user.role),
  };
}
