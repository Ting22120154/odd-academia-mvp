import { test, expect } from "@playwright/test";

test.describe("Frontend public pages", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /log in|sign up|login/i })).toBeVisible();
  });

  test("home or landing is reachable", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(home)?$/);
  });
});

test.describe("Frontend auth guard", () => {
  test("profile redirects anonymous users to login", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});
