import prisma from "@odd-academia/db/client";
import { signUserToken } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as unknown;
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { email } = body as { email?: unknown };
    if (typeof email !== "string" || !email.trim()) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return Response.json(
        {
          error:
            "No account found for that email. Use a seeded address such as rick.smith@example.com or evharper@gmail.com.",
        },
        { status: 404 },
      );
    }

    const token = signUserToken(user.id, user.email);

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
