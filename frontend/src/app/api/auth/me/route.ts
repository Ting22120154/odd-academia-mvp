import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/auth/me?email=<email>
 *  Returns the real DB user id and fullName for the given email.
 *  Used by the login page to resolve a real UUID before storing in AuthContext.
 */
export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, fullName: true, avatarUrl: true },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json(user);
}
