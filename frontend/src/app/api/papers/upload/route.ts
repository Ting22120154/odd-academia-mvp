import jwt from "jsonwebtoken";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import prisma from "../../../../../../packages/db/src/client";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_BYTES = 10 * 1024 * 1024;

const paperInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
    },
  },
  keywords: true,
  categories: true,
  contributors: true,
  references: true,
} as const;

function getBearerUserId(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload & {
      userId?: string;
    };
    if (typeof payload.userId === "string") return payload.userId;
    if (typeof payload.sub === "string") return payload.sub;
    return null;
  } catch {
    return null;
  }
}

function extensionFromMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return ".pdf";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    default:
      return "";
  }
}

export async function POST(req: Request) {
  const userId = getBearerUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileField = formData.get("file");
  if (!fileField || typeof fileField === "string") {
    return Response.json({ error: "Missing required field: file" }, { status: 400 });
  }

  const file = fileField as File;

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Invalid file type. Only PDF, DOC, DOCX allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "File too large. Max size is 10MB" },
      { status: 400 },
    );
  }

  const ext =
    path.extname(file.name) || extensionFromMime(file.type) || ".bin";
  const filename = `${Date.now()}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const fileUrl = `/uploads/${filename}`;

  try {
    await mkdir(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    const paperIdRaw = formData.get("paperId");
    const paperId =
      typeof paperIdRaw === "string" ? paperIdRaw.trim() : "";

    if (paperId) {
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        select: { id: true, authorId: true },
      });

      if (!paper) {
        return Response.json({ error: "Paper not found" }, { status: 404 });
      }
      if (paper.authorId !== userId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      const updated = await prisma.paper.update({
        where: { id: paperId },
        data: { fileUrl },
        include: paperInclude,
      });

      return Response.json(updated);
    }

    return Response.json({ fileUrl });
  } catch (error) {
    console.error("POST /api/papers/upload failed:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
