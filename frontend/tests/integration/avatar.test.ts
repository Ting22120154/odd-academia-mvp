import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as uploadAvatar, DELETE as deleteAvatar } from "@/app/api/users/me/avatar/route";
import { createTestPrisma, hasTestDatabase, uniqueSuffix } from "../helpers/db";
import { jpegFile, pngFile } from "../helpers/binary";
import {
  authCookieHeader,
  cookieFromResponse,
  formRequest,
  jsonRequest,
  readApi,
} from "../helpers/http";
import { setTestCookie } from "../setup";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";
import { unlink } from "fs/promises";
import path from "path";

const describeIfDb = hasTestDatabase() ? describe : describe.skip;

describeIfDb("avatar API integration", () => {
  let prisma: ReturnType<typeof createTestPrisma>;
  let userId = "";
  let authHeader = "";
  let authToken = "";
  const suffix = uniqueSuffix();
  const email = `test_avatar_${suffix}@test.local`;

  beforeAll(async () => {
    prisma = createTestPrisma();
    const res = await registerPost(
      jsonRequest("/api/auth/register", {
        body: {
          fullName: "Avatar Test",
          username: `av_${suffix.slice(-8)}`,
          email,
          password: "TestPass123!",
        },
      }),
    );
    authToken = cookieFromResponse(res, USER_TOKEN_COOKIE)!;
    authHeader = authCookieHeader(authToken);
    const user = await prisma.user.findUnique({ where: { email } });
    userId = user!.id;
  });

  beforeEach(() => {
    setTestCookie(USER_TOKEN_COOKIE, authToken);
  });

  afterAll(async () => {
    const diskPath = path.join(process.cwd(), "public", "uploads", "avatars", `${userId}.jpg`);
    try {
      await unlink(diskPath);
    } catch {
      // ignore
    }
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("accepts JPEG upload", async () => {
    const form = new FormData();
    form.append("file", jpegFile());
    const res = await uploadAvatar(
      formRequest("/api/users/me/avatar", form, { cookie: authHeader }),
    );
    expect(res.status).toBe(200);
    const body = await readApi<{ avatarUrl: string }>(res);
    expect(body.success).toBe(true);
    if (body.success) {
      expect(
        body.data.avatarUrl.includes("/uploads/avatars/") ||
          body.data.avatarUrl.includes("/api/users/") ||
          body.data.avatarUrl.includes("blob.vercel-storage.com"),
      ).toBe(true);
    }
  });

  it("rejects PNG upload", async () => {
    const form = new FormData();
    form.append("file", pngFile());
    const res = await uploadAvatar(
      formRequest("/api/users/me/avatar", form, { cookie: authHeader }),
    );
    expect(res.status).toBe(400);
  });

  it("DELETE clears avatar", async () => {
    const res = await deleteAvatar();
    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.avatarUrl).toBeNull();
  });
});

describe("avatar API auth", () => {
  it("POST returns 401 without session", async () => {
    const form = new FormData();
    form.append("file", jpegFile());
    const res = await uploadAvatar(formRequest("/api/users/me/avatar", form));
    expect(res.status).toBe(401);
  });
});
