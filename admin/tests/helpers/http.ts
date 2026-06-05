import { NextRequest } from "next/server";

export function jsonRequest(
  path: string,
  init: { method?: string; body?: unknown } = {},
): NextRequest {
  return new NextRequest(`http://127.0.0.1${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json" },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function readApi<T>(res: Response): Promise<ApiEnvelope<T>> {
  return res.json() as Promise<ApiEnvelope<T>>;
}
