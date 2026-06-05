import { defineConfig, devices } from "@playwright/test";

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? "http://127.0.0.1:3000";
const ADMIN_URL = process.env.PLAYWRIGHT_ADMIN_URL ?? "http://127.0.0.1:3001";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "frontend",
      testDir: "./e2e/frontend",
      use: { ...devices["Desktop Chrome"], baseURL: FRONTEND_URL },
    },
    {
      name: "admin",
      testDir: "./e2e/admin",
      use: { ...devices["Desktop Chrome"], baseURL: ADMIN_URL },
    },
  ],
});
