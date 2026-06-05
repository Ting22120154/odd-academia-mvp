import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@oddacademia.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@1234";

async function loginAdmin(page: import("@playwright/test").Page) {
  const res = await page.request.post("/api/auth/login", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe("Admin panel", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /admin|log in|sign in/i })).toBeVisible();
  });

  test("admin can log in", async ({ page }) => {
    test.setTimeout(60_000);
    await loginAdmin(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });
  });
});
