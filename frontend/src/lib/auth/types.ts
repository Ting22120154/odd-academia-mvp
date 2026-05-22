/**
 * API-facing auth types (camelCase roles for the client).
 * Prisma uses lowercase "user" | "admin"; map via toApiRole in user.ts.
 */

export type ApiRole = "USER" | "ADMIN";

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: ApiRole;
};

export type AuthResponse = {
  user: PublicUser;
};
