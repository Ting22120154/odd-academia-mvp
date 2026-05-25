/** Characters unsafe in filenames on common OS / browsers. */
const UNSAFE = /[/\\?%*:|"<>]/g;

export function sanitizePaperTitle(title: string): string {
  return title.replace(UNSAFE, "").trim().replace(/\s+/g, " ").slice(0, 120) || "paper";
}

/** Suggested name when the user downloads or saves the file. */
export function paperDownloadFilename(title: string, ext = ".pdf"): string {
  const normalizedExt = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  const base = sanitizePaperTitle(title);
  const lower = base.toLowerCase();
  if (lower.endsWith(normalizedExt)) return base;
  return `${base}${normalizedExt}`;
}

/** Relative URL + on-disk filename under public/uploads/{paperId}/. */
export function paperUploadPaths(
  title: string,
  paperId: string,
  ext: string,
): { fileUrl: string; diskName: string } {
  const normalizedExt = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  const diskName = paperDownloadFilename(title, normalizedExt);
  const fileUrl = `/uploads/${paperId}/${diskName}`;
  return { fileUrl, diskName };
}
