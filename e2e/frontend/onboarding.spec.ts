import { test } from "@playwright/test";
import { gotoExpectUrl } from "../helpers/navigation";

test.describe("Onboarding guard", () => {
  test("interests page redirects to login without pending user", async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("pendingUser"));
    await gotoExpectUrl(page, "/onboarding/interests", /\/login/);
  });
});
