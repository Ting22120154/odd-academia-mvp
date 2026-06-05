import { readFile } from "fs/promises";
import path from "path";
import prisma from "@odd-academia/db/client";
import { paperDownloadFilename } from "@/lib/files/paperFilename";
import { fetchBlobBuffer, isBlobUrl } from "@/lib/storage/blob";

const UPLOADS_PREFIX = "/uploads/";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function invalidFilePath() {
  return Response.json({ error: "Invalid file path" }, { status: 400 });
}

function resolveUploadFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith(UPLOADS_PREFIX) || fileUrl.includes("..")) {
    return null;
  }

  const publicDir = path.resolve(process.cwd(), "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const resolved = path.resolve(publicDir, fileUrl.slice(1));

  const relativeToUploads = path.relative(uploadsDir, resolved);
  if (
    relativeToUploads.startsWith("..") ||
    path.isAbsolute(relativeToUploads)
  ) {
    return null;
  }

  return resolved;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const paper = await prisma.paper.findUnique({
      where: { id },
      select: { id: true, title: true, fileUrl: true, status: true },
    });

    if (!paper?.fileUrl || paper.status !== "published") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const ext = path.extname(paper.fileUrl).toLowerCase() || ".pdf";

    let buffer: Buffer;
    let contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    if (isBlobUrl(paper.fileUrl)) {
      try {
        const blob = await fetchBlobBuffer(paper.fileUrl);
        buffer = blob.buffer;
        contentType = blob.contentType || contentType;
      } catch {
        return Response.json({ error: "File not found in storage" }, { status: 404 });
      }
    } else {
      const filePath = resolveUploadFilePath(paper.fileUrl);
      if (!filePath) {
        return invalidFilePath();
      }
      try {
        buffer = await readFile(filePath);
      } catch {
        return Response.json({ error: "File not found on disk" }, { status: 404 });
      }
    }
    const filename = paperDownloadFilename(paper.title, ext);
    const disposition = "inline";
    const encoded = encodeURIComponent(filename);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /api/papers/[id]/file failed:", error);
    return Response.json({ error: "Failed to load file" }, { status: 500 });
  }
}
