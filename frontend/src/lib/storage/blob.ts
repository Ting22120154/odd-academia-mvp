import { del, put } from "@vercel/blob";

/** True when Blob is available — read-write token OR Vercel OIDC store connection. */
export function blobStorageEnabled() {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  // Connected via Storage → Connect to Project (OIDC; no read-write token required)
  if (process.env.VERCEL && process.env.BLOB_STORE_ID?.trim()) return true;
  return false;
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
