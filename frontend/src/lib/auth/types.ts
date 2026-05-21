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
