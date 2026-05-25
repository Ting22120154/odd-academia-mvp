/**
 * Standard JSON envelope for App Router APIs:
 * Success: { success: true, data }
 * Error:   { success: false, error }
 */
import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
