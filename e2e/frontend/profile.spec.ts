import { test, expect } from "@playwright/test";
import { gotoExpectUrl } from "../helpers/navigation";

test.describe("Profile pages", () => {
  test("profile redirects to login when anonymous", async ({ page }) => {
    await gotoExpectUrl(page, "/profile", /\/login/);
  });

  test("saved-papers redirects to home when anonymous", async ({ page }) => {
    await gotoExpectUrl(page, "/saved-papers", /\/home/);
  });

  test("notifications redirects to login when anonymous", async ({ page }) => {
    await gotoExpectUrl(page, "/notifications", /\/login/);
  });
});
