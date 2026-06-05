import { del, put, type PutCommandOptions } from "@vercel/blob";

function blobCredentials(): Pick<PutCommandOptions, "token" | "storeId" | "oidcToken"> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  return {
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
    ...(oidcToken ? { oidcToken } : {}),
  };
}

/** Use Blob on Vercel (always) or locally when credentials exist. */
export function useBlobStorage() {
  if (process.env.VERCEL) return true;
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim(),
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
    ...blobCredentials(),
  });
  return url;
}

export async function deletePublicBlob(url: string | null | undefined) {
  if (!url || !isBlobUrl(url)) return;
  await del(url, blobCredentials());
}
