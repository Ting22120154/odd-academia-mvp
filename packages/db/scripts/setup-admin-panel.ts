/**
 * Ensure admin_users table + default admin panel login exist.
 * Safe to run multiple times (does not wipe other data).
 *
 * Usage (from packages/db):
 *   pnpm run db:setup-admin-panel
 *
 * DATABASE_URL must match Frontend Vercel env (same Neon database).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { adminPanelPassword, adminSeedUser } from "../src/data";

const prisma = new PrismaClient();
const SALT = 10;

async function ensureAdminUsersTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "admin_users" (
      "id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "admin_email" TEXT NOT NULL,
      "password_hash" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_user_id_key"
    ON "admin_users"("user_id");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_admin_email_key"
    ON "admin_users"("admin_email");
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      ALTER TABLE "admin_users"
        ADD CONSTRAINT "admin_users_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

async function ensureAdminAccount() {
  const email = adminSeedUser.email.toLowerCase();
  const userHash = await bcrypt.hash(adminSeedUser.password, SALT);
  const panelHash = await bcrypt.hash(adminPanelPassword, SALT);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        fullName: adminSeedUser.fullName,
        username: adminSeedUser.username,
        email,
        passwordHash: userHash,
        role: adminSeedUser.role,
        profileVisibility: adminSeedUser.profileVisibility,
        isEmailVerified: adminSeedUser.isEmailVerified,
      },
    });
    console.log(`Created User row: ${email}`);
  } else if (user.role !== "admin") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
    });
    console.log(`Updated User role to admin: ${email}`);
  }

  const existing = await prisma.adminUser.findUnique({ where: { adminEmail: email } });
  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: {
        userId: user.id,
        adminEmail: email,
        passwordHash: panelHash,
      },
    });
    console.log(`Updated AdminUser login: ${email} / ${adminPanelPassword}`);
    return;
  }

  await prisma.adminUser.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      adminEmail: email,
      passwordHash: panelHash,
    },
  });
  console.log(`Created AdminUser login: ${email} / ${adminPanelPassword}`);
}

async function main() {
  const dbHost = process.env.DATABASE_URL?.match(/@([^/]+)\//)?.[1] ?? "unknown";
  console.log(`Target database host: ${dbHost}`);

  await ensureAdminUsersTable();
  console.log("admin_users table: OK");

  await ensureAdminAccount();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
