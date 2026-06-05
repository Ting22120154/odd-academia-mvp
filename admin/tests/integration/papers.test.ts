import { describe, expect, it } from "vitest";
import { POST as adminLogin } from "@/app/api/auth/login/route";
import { GET as papersGet } from "@/app/api/admin/papers/route";
import { jsonRequest } from "../helpers/http";
import { setAdminTestCookie, clearAdminTestCookies } from "../setup";

const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb("admin papers list", () => {
  it("lists papers for authenticated admin", async () => {
    clearAdminTestCookies();
    const loginRes = await adminLogin(
      jsonRequest("/api/auth/login", {
        body: { email: "admin@oddacademia.com", password: "Admin@1234" },
      }),
    );
    if (loginRes.status !== 200) return;

    const setCookie = loginRes.headers.getSetCookie?.() ?? [];
    const token = setCookie
      .find((c) => c.startsWith("oa_admin_token="))
      ?.split(";")[0]
      ?.split("=")[1];
    setAdminTestCookie("oa_admin_token", token!);

    const res = await papersGet(new Request("http://127.0.0.1/api/admin/papers"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
