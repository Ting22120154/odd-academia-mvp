import { PrismaClient } from "@prisma/client";

export function getTestDatabaseUrl(): string | undefined {
  return process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
}

export const hasTestDatabase = (): boolean => Boolean(getTestDatabaseUrl());

export function createTestPrisma(): PrismaClient {
  const url = getTestDatabaseUrl();
  if (!url) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for integration tests");
  }
  return new PrismaClient({ datasources: { db: { url } } });
}

export function uniqueSuffix(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
