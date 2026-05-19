/**
 * In-memory credentials store.
 *
 * Attached to globalThis so it survives Next.js hot module reloads in dev.
 * Changes persist for the lifetime of the server process.
 * Replace with a database read/write once Prisma is wired up.
 */
declare global {
  // eslint-disable-next-line no-var
  var _adminCredentials: { email: string; password: string } | undefined;
}

if (!globalThis._adminCredentials) {
  globalThis._adminCredentials = {
    email:    "admin@oddacademia.com",
    password: "Admin@1234",
  };
}

export const adminCredentials = globalThis._adminCredentials;
