import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { GET as settingsGet, PATCH as settingsPatch } from "@/app/api/notifications/settings/route";
import { PATCH as markReadPatch } from "@/app/api/notifications/mark-read/route";
import { createTestPrisma, hasTestDatabase, uniqueSuffix } from "../helpers/db";
import { authCookieHeader, cookieFromResponse, jsonRequest } from "../helpers/http";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";

const describeIfDb = hasTestDatabase() ? describe : describe.skip;

describeIfDb("notifications API integration", () => {
  let prisma: ReturnType<typeof createTestPrisma>;
  let authHeader = "";
  const suffix = uniqueSuffix();
  const email = `test_notif_${suffix}@test.local`;

  beforeAll(async () => {
    prisma = createTestPrisma();
    const res = await registerPost(
      jsonRequest("/api/auth/register", {
        body: {
          fullName: "Notif Test",
          username: `nt_${suffix.slice(-8)}`,
          email,
          password: "TestPass123!",
        },
      }),
    );
    authHeader = authCookieHeader(cookieFromResponse(res, USER_TOKEN_COOKIE)!);
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      await prisma.notificationSettings.deleteMany({ where: { userId: user.id } });
    }
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("GET settings returns defaults for new user", async () => {
    const res = await settingsGet(
      jsonRequest("/api/notifications/settings", { cookie: authHeader }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.settings).toBeDefined();
  });

  it("PATCH settings persists changes", async () => {
    const res = await settingsPatch(
      jsonRequest("/api/notifications/settings", {
        method: "PATCH",
        cookie: authHeader,
        body: { followedAuthors: false, repliedTo: true },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.followedAuthors).toBe(false);
    expect(body.settings.repliedTo).toBe(true);
  });
});

describe("notifications mark-read validation", () => {
  it("PATCH mark-read returns 401 without auth", async () => {
    const res = await markReadPatch(
      jsonRequest("/api/notifications/mark-read", {
        method: "PATCH",
        body: { ids: ["550e8400-e29b-41d4-a716-446655440000"] },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("PATCH mark-read rejects empty ids", async () => {
    const res = await markReadPatch(
      jsonRequest("/api/notifications/mark-read", {
        method: "PATCH",
        cookie: "oa_user_token=invalid",
        body: { ids: [] },
      }),
    );
    expect([400, 401]).toContain(res.status);
  });
});
