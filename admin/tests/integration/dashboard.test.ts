import { describe, expect, it } from "vitest";
import { POST as adminLogin } from "@/app/api/auth/login/route";
import { GET as dashboardGet } from "@/app/api/admin/dashboard/route";
import { jsonRequest } from "../helpers/http";
import { setAdminTestCookie, clearAdminTestCookies } from "../setup";

const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb("admin dashboard integration", () => {
  it("returns stats when admin is authenticated", async () => {
    clearAdminTestCookies();
    const loginRes = await adminLogin(
      jsonRequest("/api/auth/login", {
        body: { email: "admin@oddacademia.com", password: "Admin@1234" },
      }),
    );
    if (loginRes.status !== 200) {
      expect(loginRes.status).toBe(401);
      return;
    }

    const setCookie = loginRes.headers.getSetCookie?.() ?? [];
    const tokenPair = setCookie.find((c) => c.startsWith("oa_admin_token="));
    const token = tokenPair?.split(";")[0]?.split("=")[1];
    expect(token).toBeTruthy();
    setAdminTestCookie("oa_admin_token", token!);

    const res = await dashboardGet(new Request("http://127.0.0.1/api/admin/dashboard"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });
});

describe("admin dashboard auth", () => {
  it("GET dashboard returns 401 without admin cookie", async () => {
    clearAdminTestCookies();
    const res = await dashboardGet(new Request("http://127.0.0.1/api/admin/dashboard"));
    expect(res.status).toBe(401);
  });
});
