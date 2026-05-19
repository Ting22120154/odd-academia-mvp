// Re-exported from the shared data package — single source of truth.
// To update user data, edit packages/db/src/data.ts (users array, index 0 = Rick Smith).
export type { FrontendUser as MockUser } from "@odd-academia/db";
export { mockFrontendCurrentUser as mockUser } from "@odd-academia/db";
