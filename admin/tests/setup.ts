import { beforeEach, vi } from "vitest";

process.env.JWT_SECRET ??= "test-jwt-secret-for-vitest-only";
process.env.NODE_ENV ??= "test";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
    set: () => {},
    delete: () => {},
  })),
}));

export function setAdminTestCookie(name: string, value: string) {
  cookieJar.set(name, value);
}

export function clearAdminTestCookies() {
  cookieJar.clear();
}

beforeEach(() => {
  clearAdminTestCookies();
});
