import { test, expect } from "@playwright/test";

test.describe("Onboarding guard", () => {
  test("interests page redirects to login without pending user", async ({ page }) => {
    await page.goto("/onboarding/interests");
    await expect(page).toHaveURL(/\/login/);
  });
});
