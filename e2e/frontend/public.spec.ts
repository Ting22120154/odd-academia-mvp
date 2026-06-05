import { test, expect } from "@playwright/test";
import { gotoExpectUrl } from "../helpers/navigation";

test.describe("Frontend public pages", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login", { waitUntil: "commit" }).catch(() => {});
    await expect(
      page.getByRole("heading", { name: /log in to odd academia/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("home or landing is reachable", async ({ page }) => {
    await gotoExpectUrl(page, "/", /\/(home)?$/);
  });
});

test.describe("Frontend auth guard", () => {
  test("profile redirects anonymous users to login", async ({ page }) => {
    await gotoExpectUrl(page, "/profile", /\/login/);
  });
});
