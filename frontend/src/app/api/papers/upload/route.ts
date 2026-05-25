import { mkdir, writeFile } from "fs/promises";
import path from "path";
import prisma from "@odd-academia/db/client";
import { getBearerUserId } from "@/lib/auth/jwt";
import { paperUploadPaths } from "@/lib/files/paperFilename";
import { paperInclude } from "@/lib/papers/constants";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_BYTES = 10 * 1024 * 1024;

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

  let mimeType = file.type;
  if (!mimeType || !ALLOWED_TYPES.has(mimeType)) {
    const ext = path.extname(file.name).toLowerCase();
    if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".doc") mimeType = "application/msword";
    else if (ext === ".docx") {
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  }

  if (!ALLOWED_TYPES.has(mimeType)) {
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
    path.extname(file.name) || extensionFromMime(mimeType) || ".bin";

  const paperIdRaw = formData.get("paperId");
  const paperId =
    typeof paperIdRaw === "string" ? paperIdRaw.trim() : "";

  try {
    let fileUrl: string;
    let absolutePath: string;

    if (paperId) {
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        select: { id: true, authorId: true, title: true },
      });

      if (!paper) {
        return Response.json({ error: "Paper not found" }, { status: 404 });
      }
      if (paper.authorId !== userId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      const paths = paperUploadPaths(paper.title, paper.id, ext);
      fileUrl = paths.fileUrl;
      absolutePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        paper.id,
        paths.diskName,
      );
    } else {
      const filename = `${Date.now()}${ext}`;
      fileUrl = `/uploads/${filename}`;
      absolutePath = path.join(process.cwd(), "public", "uploads", filename);
    }

    await mkdir(path.dirname(absolutePath), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    if (paperId) {
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
