"use client";

/**
 * Client auth state for the main app.
 * - Logged-in: validated via GET /api/auth/me (httpOnly JWT cookie).
 * - Guest: localStorage + auth-session=guest cookie (browse only; write APIs need login).
 * - applySession (alias login): called after login/register; logout hits /api/auth/logout.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/auth/types";

export type AuthUser = Pick<PublicUser, "id" | "fullName" | "email" | "avatarUrl"> & {
  role?: PublicUser["role"];
};

type AuthState = {
  user: AuthUser | null;
  isGuest: boolean;
  isLoggedIn: boolean;
  applySession: (user: AuthUser) => void;
  /** @deprecated Use applySession — kept so older callers using login() still work */
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function toAuthUser(u: PublicUser): AuthUser {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: { user?: PublicUser };
      } | null;

      if (json?.success && json.data?.user) {
        setUser(toAuthUser(json.data.user));
        setIsGuest(false);
        localStorage.removeItem("isGuest");
        return;
      }

      // Only clear session when the server says the token/user is invalid.
      if (res.status === 401 || res.status === 404) {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
        setUser(null);
        setIsGuest(false);
      }
    } catch {
      // Network error — keep existing client session; retry on next load.
    }
  }, []);

  useEffect(() => {
    async function hydrate() {
      if (localStorage.getItem("isGuest") === "true") {
        setIsGuest(true);
        setUser(null);
        setHydrated(true);
        return;
      }
      await refreshSession();
      setHydrated(true);
    }
    hydrate();
  }, [refreshSession]);

  const applySession = useCallback((userData: AuthUser) => {
    localStorage.removeItem("isGuest");
    setUser(userData);
    setIsGuest(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // still clear local state
    }
    localStorage.removeItem("isGuest");
    localStorage.removeItem("guestViewedPapers");
    setUser(null);
    setIsGuest(false);
    router.push("/login");
  }, [router]);

  const continueAsGuest = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // still enter guest mode
    }
    localStorage.setItem("isGuest", "true");
    document.cookie = "auth-session=guest; path=/; max-age=86400";
    setIsGuest(true);
    setUser(null);
    router.push("/home");
  }, [router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto w-full max-w-[var(--page-max)] px-6 py-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200/80" />
          <div className="mt-6 space-y-4">
            <div className="h-32 animate-pulse rounded-2xl bg-white shadow-[var(--shadow-sm)]" />
            <div className="h-48 animate-pulse rounded-2xl bg-white shadow-[var(--shadow-sm)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isLoggedIn: user !== null,
        applySession,
        login: applySession,
        logout,
        continueAsGuest,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
