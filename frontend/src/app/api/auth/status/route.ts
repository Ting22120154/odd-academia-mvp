import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/auth/status?userId=<id>
 *  Used by AuthContext on hydration to detect bans applied to active sessions.
 *  Returns 403 if the user is banned, 404 if the user no longer exists, 200 otherwise.
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { isBanned: true },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // AUTH GUARD: Block login for suspended/banned accounts before token issuance
  if (user.isBanned) {
    return NextResponse.json(
      { error: "Your account has been suspended. Contact support to appeal." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
