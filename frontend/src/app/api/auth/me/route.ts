import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// APPEAL INFO: Admin contact email must be surfaced in both email and UI error message
const APPEAL_EMAIL = "support@oddacademia.com";

/** POST /api/auth/me
 *  Body: { email, password }
 *  Validates credentials against DB and returns { id, fullName, avatarUrl }.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = (body ?? {}) as Record<string, string>;

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, fullName: true, avatarUrl: true, passwordHash: true, isBanned: true },
  });

  if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  // AUTH GUARD: Block login for suspended/banned accounts before token issuance
  if (user.isBanned) {
    return NextResponse.json(
      {
        error:       "Your account has been suspended. Contact support to appeal.",
        appealEmail: APPEAL_EMAIL,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl });
}
