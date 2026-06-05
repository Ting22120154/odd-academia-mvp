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
  return (
    url.startsWith("https://") &&
    url.includes(".blob.vercel-storage.com/")
  );
}

export async function uploadBlob(
  pathname: string,
  buffer: Buffer,
  contentType: string,
) {
  const { url } = await put(pathname, buffer, {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    ...blobCredentials(),
  });
  return url;
}

export async function deleteBlob(urlOrPathname: string) {
  await del(urlOrPathname, blobCredentials());
}

/** Fetch a private blob for server-side streaming (PDF / avatar proxy). */
export async function fetchBlobBuffer(
  urlOrPathname: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const creds = blobCredentials();

  if (token) {
    const res = await fetch(urlOrPathname, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Blob fetch failed (${res.status})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    return { buffer, contentType };
  }

  // OIDC: use SDK-delivered download URL via authenticated fetch on the blob URL
  const res = await fetch(urlOrPathname, {
    headers: creds.oidcToken
      ? { authorization: `Bearer ${creds.oidcToken}` }
      : undefined,
  });
  if (!res.ok) {
    throw new Error(`Blob fetch failed (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return { buffer, contentType };
}
