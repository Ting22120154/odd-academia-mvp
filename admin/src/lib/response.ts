/**
 * Shared JSON response helpers.
 *
 * Keeps API route return shapes consistent:
 *   { success: true,  data: T }      — for ok()
 *   { success: false, error: string } — for err()
 */

import { NextResponse } from "next/server";

/** Returns a successful JSON response with the given data payload. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Returns an error JSON response with a human-readable message. */
export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
