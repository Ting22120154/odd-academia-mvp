import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/users/search/route";
import { jsonRequest } from "../../helpers/http";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  getRouteUserId: vi.fn(async () => "viewer-1"),
}));

describe("GET /api/users/search", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("returns empty list for blank query", async () => {
    const res = await GET(jsonRequest("/api/users/search?q="));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.users).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("searches public users by username or full name", async () => {
    findMany.mockResolvedValue([
      {
        id: "u1",
        fullName: "Se-on",
        username: "seon",
        avatarUrl: null,
      },
    ]);

    const res = await GET(jsonRequest("/api/users/search?q=seon&limit=8"));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.users).toHaveLength(1);
    expect(body.data.users[0].username).toBe("seon");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          profileVisibility: true,
          isBanned: false,
        }),
        take: 8,
      }),
    );
  });

  it("returns 401 when not authenticated", async () => {
    const { getRouteUserId } = await import("@/lib/auth/require-auth");
    vi.mocked(getRouteUserId).mockResolvedValueOnce(null);

    const res = await GET(jsonRequest("/api/users/search?q=seon"));
    expect(res.status).toBe(401);
  });
});
