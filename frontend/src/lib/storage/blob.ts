import { del, put } from "@vercel/blob";

export function blobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function storageNotConfiguredResponse() {
  if (!process.env.VERCEL || blobStorageEnabled()) return null;
  return Response.json(
    { error: "File storage is not configured. Add Vercel Blob to this project." },
    { status: 503 },
  );
}

export function isBlobUrl(url: string) {
  return url.startsWith("https://") && url.includes(".blob.vercel-storage.com/");
}

export async function uploadPublicBlob(
  pathname: string,
  buffer: Buffer,
  contentType: string,
) {
  const { url } = await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return url;
}

export async function deletePublicBlob(url: string | null | undefined) {
  if (!url || !isBlobUrl(url)) return;
  await del(url);
}
