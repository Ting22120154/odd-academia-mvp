import { redirect } from "next/navigation";

/**
 * Backward-compatible route.
 * We standardise on `/paper/:id` (shareable URL requirement).
 */
export default async function LegacyPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/paper/${id}`);
}

