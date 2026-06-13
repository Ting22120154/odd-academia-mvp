import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { GET as meGet, PATCH as mePatch } from "@/app/api/users/me/route";
import { GET as userGet } from "@/app/api/users/[id]/route";
import { createTestPrisma, hasTestDatabase, uniqueSuffix } from "../helpers/db";
import { cookieFromResponse, jsonRequest, readApi } from "../helpers/http";
import { setTestCookie } from "../setup";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";

const describeIfDb = hasTestDatabase() ? describe : describe.skip;

describeIfDb("users/me API integration", () => {
  let prisma: ReturnType<typeof createTestPrisma>;
  const suffix = uniqueSuffix();
  const email = `test_profile_${suffix}@test.local`;
  const username = `prof_${suffix.slice(-8)}`;
  const password = "TestPass123!";
  let userId = "";
  let authCookie = "";

  beforeAll(async () => {
    prisma = createTestPrisma();
    const res = await registerPost(
      jsonRequest("/api/auth/register", {
        body: { fullName: "Profile Test", username, email, password },
      }),
    );
    authCookie = cookieFromResponse(res, USER_TOKEN_COOKIE)!;
    const user = await prisma.user.findUnique({ where: { email } });
    userId = user!.id;
  });

  beforeEach(() => {
    setTestCookie(USER_TOKEN_COOKIE, authCookie);
  });

  afterAll(async () => {
    await prisma.userInterest.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("PATCH persists bio, jobTitle, education, links, workStatus", async () => {
    const patchRes = await mePatch(
      jsonRequest("/api/users/me", {
        method: "PATCH",
        body: {
          bio: "Test bio",
          jobTitle: "Engineer",
          education: "BSc CS",
          github: "https://github.com/test",
          linkedin: "https://linkedin.com/in/test",
          workStatus: "Employed",
          interests: ["AI", "Technology"],
        },
      }),
    );
    expect(patchRes.status).toBe(200);

    const getRes = await meGet();
    const body = await readApi<{ user: Record<string, unknown> }>(getRes);
    expect(body.success).toBe(true);
    if (!body.success) return;

    const user = body.data.user;
    expect(user.bio).toBe("Test bio");
    expect(user.jobTitle).toBe("Engineer");
    expect(user.education).toBe("BSc CS");
    expect(user.github).toBe("https://github.com/test");
    expect(user.linkedin).toBe("https://linkedin.com/in/test");
    expect(user.workStatus).toBe("Employed");
    expect(user.interests).toEqual(["AI", "Technology"]);
  });

  it("GET /api/users/[id] returns public profile", async () => {
    const res = await userGet(jsonRequest(`/api/users/${userId}`), {
      params: Promise.resolve({ id: userId }),
    });
    expect(res.status).toBe(200);
    const body = await readApi<{ user: { id: string; bio: string } }>(res);
    expect(body.success).toBe(true);
    if (body.success) {
      expect(body.data.user.id).toBe(userId);
      expect(body.data.user.bio).toBe("Test bio");
    }
  });
});

describe("users/me auth guard", () => {
  it("GET returns 401 without session", async () => {
    const res = await meGet(jsonRequest("/api/users/me"));
    expect(res.status).toBe(401);
  });
});
