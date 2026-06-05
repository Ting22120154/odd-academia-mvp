import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { createTestPrisma, hasTestDatabase, uniqueSuffix } from "../helpers/db";
import { cookieFromResponse, jsonRequest, readApi } from "../helpers/http";
import { setTestCookie } from "../setup";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";

const describeIfDb = hasTestDatabase() ? describe : describe.skip;

describeIfDb("auth API integration", () => {
  let prisma: ReturnType<typeof createTestPrisma>;
  const suffix = uniqueSuffix();
  const email = `test_auth_${suffix}@test.local`;
  const username = `test_${suffix.slice(-8)}`;
  const password = "TestPass123!";

  beforeAll(() => {
    prisma = createTestPrisma();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers a user and sets session cookie", async () => {
    const res = await registerPost(
      jsonRequest("/api/auth/register", {
        body: { fullName: "Test User", username, email, password },
      }),
    );
    expect(res.status).toBe(200);
    const body = await readApi<{ user: { email: string } }>(res);
    expect(body.success).toBe(true);
    if (body.success) expect(body.data.user.email).toBe(email);
    expect(cookieFromResponse(res, USER_TOKEN_COOKIE)).toBeTruthy();
  });

  it("logs in with valid credentials", async () => {
    const res = await loginPost(
      jsonRequest("/api/auth/login", {
        body: { email, password },
      }),
    );
    expect(res.status).toBe(200);
    expect(cookieFromResponse(res, USER_TOKEN_COOKIE)).toBeTruthy();
  });

  it("rejects invalid login", async () => {
    const res = await loginPost(
      jsonRequest("/api/auth/login", {
        body: { email, password: "wrong-password" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns current user from /api/auth/me", async () => {
    const loginRes = await loginPost(
      jsonRequest("/api/auth/login", { body: { email, password } }),
    );
    const token = cookieFromResponse(loginRes, USER_TOKEN_COOKIE);
    expect(token).toBeTruthy();
    setTestCookie(USER_TOKEN_COOKIE, token!);
    const res = await meGet();
    expect(res.status).toBe(200);
    const body = await readApi<{ user: { email: string } }>(res);
    expect(body.success).toBe(true);
  });
});

describe("auth API validation (no DB)", () => {
  it("register rejects missing fields", async () => {
    const res = await registerPost(jsonRequest("/api/auth/register", { body: { email: "a@b.c" } }));
    expect(res.status).toBe(400);
  });

  it("register rejects short password", async () => {
    const res = await registerPost(
      jsonRequest("/api/auth/register", {
        body: {
          fullName: "A",
          username: "valid_user",
          email: "a@b.c",
          password: "short",
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});
