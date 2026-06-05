import { NextRequest } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";
import { signToken } from "@/lib/auth/jwt";

export function jsonRequest(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    cookie?: string;
    userId?: string;
    email?: string;
    role?: "user" | "admin";
  } = {},
): NextRequest {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (init.cookie) {
    headers.set("Cookie", init.cookie);
  } else if (init.userId && init.email) {
    const token = signToken({
      sub: init.userId,
      email: init.email,
      role: init.role ?? "user",
    });
    headers.set("Cookie", `${USER_TOKEN_COOKIE}=${token}`);
  }

  return new NextRequest(`http://127.0.0.1${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

export async function readJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function readApi<T>(res: Response): Promise<ApiEnvelope<T>> {
  return readJson<ApiEnvelope<T>>(res);
}

export function cookieFromResponse(res: Response, name: string): string | undefined {
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookie) {
    const [pair] = raw.split(";");
    const [k, v] = pair.split("=");
    if (k?.trim() === name) return v;
  }
  return undefined;
}
