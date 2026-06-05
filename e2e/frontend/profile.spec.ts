import { test, expect } from "@playwright/test";

test.describe("Profile pages", () => {
  test("profile redirects to login when anonymous", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("saved-papers redirects to login when anonymous", async ({ page }) => {
    await page.goto("/saved-papers");
    await expect(page).toHaveURL(/\/login/);
  });

  test("notifications redirects to login when anonymous", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/login/);
  });
});
