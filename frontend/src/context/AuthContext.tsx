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
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "@/lib/auth/client";

/** Default DB user used for API calls after mock login (Rick Smith). */
const API_LOGIN_EMAIL = "rick.smith@example.com";

type AuthUser = Pick<MockUser, "id" | "fullName" | "email" | "avatarUrl">;

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    const storedGuest = localStorage.getItem("isGuest");
    const storedToken = getStoredAccessToken();

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
        if (storedToken) setAccessToken(storedToken);
      } catch {
        localStorage.removeItem("authUser");
        clearStoredAccessToken();
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
      document.cookie = "auth-session=user; path=/; max-age=604800; SameSite=Lax";
      setUser(userData);
      setIsGuest(false);

      // Mock login UI — still fetch a real JWT in the background for API routes.
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: API_LOGIN_EMAIL }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { token?: string } | null) => {
          if (data?.token) {
            setStoredAccessToken(data.token);
            setAccessToken(data.token);
          }
        })
        .catch(() => {
          /* ignore — user can still browse; submit may need re-login later */
        });

      router.push("/");
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("isGuest");
    localStorage.removeItem("guestViewedPapers");
    localStorage.removeItem("pendingUser");
    clearStoredAccessToken();
    document.cookie = "auth-session=; path=/; max-age=0; SameSite=Lax";
    setUser(null);
    setAccessToken(null);
    setIsGuest(false);
    router.replace("/");
  }, [router]);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem("isGuest", "true");
    clearStoredAccessToken();
    document.cookie = "auth-session=guest; path=/; max-age=86400; SameSite=Lax";
    setIsGuest(true);
    setUser(null);
    setAccessToken(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isGuest,
        isLoggedIn: hydrated && user !== null,
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
