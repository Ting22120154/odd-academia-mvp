import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_USER_EMAIL;
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD;

test.describe("Frontend login flow", () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  test("user can log in and open profile", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL!);
    await page.getByLabel(/^password/i).fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.goto("/profile");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
