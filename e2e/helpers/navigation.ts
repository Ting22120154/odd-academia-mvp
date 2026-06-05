import { expect, type Page } from "@playwright/test";

/** Server/client redirects can abort the first navigation in Playwright. */
export async function gotoExpectUrl(
  page: Page,
  path: string,
  urlPattern: RegExp,
  timeout = 30_000,
) {
  await page.goto(path, { waitUntil: "commit" }).catch(() => {});
  await expect(page).toHaveURL(urlPattern, { timeout });
}
