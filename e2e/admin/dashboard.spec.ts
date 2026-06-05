import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@oddacademia.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@1234";

test.describe("Admin dashboard", () => {
  test("admin reaches dashboard after login", async ({ page }) => {
    test.setTimeout(60_000);
    const res = await page.request.post("/api/auth/login", {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });
    await page.goto("/papers", { waitUntil: "commit" }).catch(() => {});
    await expect(page).toHaveURL(/\/papers/, { timeout: 30_000 });
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15_000 });
  });
});
