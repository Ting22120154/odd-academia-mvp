import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import prisma from "@odd-academia/db/client";
import { getRouteUserId } from "@/lib/auth/require-auth";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { paperUploadPaths } from "@/lib/files/paperFilename";
import { paperInclude } from "@/lib/papers/constants";
import {
  blobStorageEnabled,
  storageNotConfiguredResponse,
  uploadPublicBlob,
} from "@/lib/storage/blob";

const UPLOAD_LIMIT = 10;
const WINDOW_MS = 60_000;

const ALLOWED_TYPES = new Set(["application/pdf"]);

const MAX_BYTES = 10 * 1024 * 1024;

function unsupportedFileType() {
  return Response.json({ error: "Unsupported file type" }, { status: 400 });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`papers:upload:${ip}`, UPLOAD_LIMIT, WINDOW_MS)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    console.error("POST /api/papers/upload formData parse failed:", err);
    return Response.json(
      {
        error:
          "Could not read upload. Use a PDF under 10MB and restart the dev server if this persists.",
      },
      { status: 400 },
    );
  }

  const paperIdRaw = formData.get("paperId");
  const paperId =
    typeof paperIdRaw === "string" ? paperIdRaw.trim() : "";
  if (!paperId) {
    return Response.json({ error: "paperId is required" }, { status: 400 });
  }

  const userId = await getRouteUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storageError = storageNotConfiguredResponse();
  if (storageError) return storageError;

  const fileField = formData.get("file");
  if (!fileField || typeof fileField === "string") {
    return Response.json({ error: "Missing required field: file" }, { status: 400 });
  }

  const file = fileField as File;

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "File too large. Max size is 10MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected || !ALLOWED_TYPES.has(detected.mime)) {
    return unsupportedFileType();
  }

  const declaredType = file.type?.trim();
  if (declaredType && declaredType !== detected.mime) {
    return unsupportedFileType();
  }

  const ext = `.${detected.ext}`;
  const nameExt = path.extname(file.name).toLowerCase();
  if (nameExt && nameExt !== ext) {
    return unsupportedFileType();
  }

  try {
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
    let fileUrl = paths.fileUrl;

    if (blobStorageEnabled()) {
      fileUrl = await uploadPublicBlob(
        `papers/${paper.id}/${paths.diskName}`,
        buffer,
        detected.mime,
      );
    } else {
      const absolutePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        paper.id,
        paths.diskName,
      );
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, buffer);
    }

    const updated = await prisma.paper.update({
      where: { id: paperId },
      data: { fileUrl },
      include: paperInclude,
    });

    return Response.json(updated);
  } catch (error) {
    console.error("POST /api/papers/upload failed:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
