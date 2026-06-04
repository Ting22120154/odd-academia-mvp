/**
 * Create a single admin user (no full seed, does not wipe data).
 * Usage: pnpm exec tsx scripts/create-admin.ts  (from packages/db)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { adminPanelPassword, adminSeedUser } from "../src/data";

const prisma = new PrismaClient();
const SALT = 10;

async function main() {
  const email = adminSeedUser.email.toLowerCase();
  const existing = await prisma.adminUser.findUnique({ where: { adminEmail: email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const userHash = await bcrypt.hash(adminSeedUser.password, SALT);
  const panelHash = await bcrypt.hash(adminPanelPassword, SALT);

  const user = await prisma.user.create({
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

  await prisma.adminUser.create({
    data: {
      userId: user.id,
      adminEmail: email,
      passwordHash: panelHash,
    },
  });

  console.log(`Created admin panel login: ${email} / ${adminPanelPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
