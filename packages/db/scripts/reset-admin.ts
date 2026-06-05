/**
 * Reset admin panel login to seed defaults (email + password).
 * Does not wipe other data.
 * Usage: pnpm exec tsx scripts/reset-admin.ts  (from packages/db)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { adminPanelPassword, adminSeedUser } from "../src/data";

const prisma = new PrismaClient();
const SALT = 10;

async function main() {
  const email = adminSeedUser.email.toLowerCase();
  const panelHash = await bcrypt.hash(adminPanelPassword, SALT);

  const admins = await prisma.adminUser.findMany({ include: { user: true } });
  if (admins.length === 0) {
    console.log("No admin account found. Run: pnpm exec tsx scripts/create-admin.ts");
    return;
  }

  for (const admin of admins) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        adminEmail: email,
        passwordHash: panelHash,
      },
    });

    await prisma.user.update({
      where: { id: admin.userId },
      data: { email },
    });

    console.log(`Reset admin panel login: ${email} / ${adminPanelPassword}`);
    console.log(`  (was: ${admin.adminEmail})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
