"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { MockUser } from "@/data/mockUser";
import { AUTH_USER_COOKIE } from "@/lib/auth/session";

type AuthUser = Pick<MockUser, "id" | "fullName" | "email" | "avatarUrl">;

type AuthState = {
  user: AuthUser | null;
  isGuest: boolean;
  isLoggedIn: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Rehydrate from localStorage — only runs client-side (SSR-safe)
    const storedUser = localStorage.getItem("authUser");
    const storedGuest = localStorage.getItem("isGuest");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setUser(parsed);
        // Sync Neon user id for APIs (fixes legacy mock ids like u_1)
        if (parsed.email) {
          void fetch("/api/auth/bridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email: parsed.email }),
          })
            .then((res) => res.json())
            .then((data: { success?: boolean; user?: AuthUser }) => {
              if (!data.success || !data.user?.id) return;
              const updated = { ...parsed, ...data.user };
              localStorage.setItem("authUser", JSON.stringify(updated));
              document.cookie = `${AUTH_USER_COOKIE}=${encodeURIComponent(data.user.id)}; path=/; max-age=604800; samesite=lax`;
              setUser(updated);
            })
            .catch(() => {});
        }
      } catch {
        localStorage.removeItem("authUser");
      }
    } else if (storedGuest === "true") {
      setIsGuest(true);
    }
    setHydrated(true);
  }, []);

  const login = useCallback(
    (userData: AuthUser) => {
      localStorage.setItem("authUser", JSON.stringify(userData));
      localStorage.removeItem("isGuest");
      // Mirror into cookies so proxy + comment APIs can read session server-side
      document.cookie = "auth-session=user; path=/; max-age=604800";
      document.cookie = `${AUTH_USER_COOKIE}=${encodeURIComponent(userData.id)}; path=/; max-age=604800; samesite=lax`;
      setUser(userData);
      setIsGuest(false);
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("isGuest");
    localStorage.removeItem("guestViewedPapers");
    document.cookie = "auth-session=; path=/; max-age=0";
    document.cookie = `${AUTH_USER_COOKIE}=; path=/; max-age=0`;
    setUser(null);
    setIsGuest(false);
    router.push("/login");
  }, [router]);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem("isGuest", "true");
    document.cookie = "auth-session=guest; path=/; max-age=86400";
    setIsGuest(true);
    setUser(null);
    router.push("/");
  }, [router]);

  // Block render until localStorage is read — prevents hydration mismatch
  if (!hydrated) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isLoggedIn: user !== null,
        login,
        logout,
        continueAsGuest,
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
