import { useBlobStorage } from "@/lib/storage/blob";

/** GET /api/health/storage — verify Blob env + deployed code version */
export async function GET() {
  return Response.json({
    version: "storage-v2",
    vercel: Boolean(process.env.VERCEL),
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID?.trim()),
    hasOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN?.trim()),
    useBlobStorage: useBlobStorage(),
  });
}
