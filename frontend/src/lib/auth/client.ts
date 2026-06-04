const ACCESS_TOKEN_KEY = "authToken";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/** Headers for authenticated API requests from the browser. */
export function getAuthHeaders(
  extra?: HeadersInit,
): Record<string, string> {
  const token = getStoredAccessToken();
  return {
    ...(extra as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
