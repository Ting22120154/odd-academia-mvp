import { readFile } from "fs/promises";
import path from "path";
import prisma from "@odd-academia/db/client";
import { paperDownloadFilename } from "@/lib/files/paperFilename";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const download = new URL(req.url).searchParams.get("download") === "1";

    const paper = await prisma.paper.findUnique({
      where: { id },
      select: { id: true, title: true, fileUrl: true, status: true },
    });

    if (!paper?.fileUrl || paper.status === "removed") {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const relative = paper.fileUrl.startsWith("/")
      ? paper.fileUrl.slice(1)
      : paper.fileUrl;
    const filePath = path.join(process.cwd(), "public", relative);

    let buffer: Buffer;
    try {
      buffer = await readFile(filePath);
    } catch {
      return Response.json({ error: "File not found on disk" }, { status: 404 });
    }

    const ext = path.extname(paper.fileUrl).toLowerCase() || ".pdf";
    const filename = paperDownloadFilename(paper.title, ext);
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const disposition = download ? "attachment" : "inline";
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
