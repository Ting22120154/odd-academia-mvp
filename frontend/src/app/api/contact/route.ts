import { NextResponse } from "next/server";

// The Contact feature has been consolidated into the Messages feature.
// Use POST /api/messages instead. This endpoint is kept to return a
// meaningful error rather than a 404 for any lingering client calls.
export async function POST() {
  return NextResponse.json(
    { error: "The Contact endpoint has been removed. Use /api/messages for direct messaging." },
    { status: 410 },
  );
}
