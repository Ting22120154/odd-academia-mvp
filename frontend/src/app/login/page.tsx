"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { mockUser } from "@/data/mockUser";

type Tab = "signin" | "signup";

// Inner component reads useSearchParams — must be wrapped in <Suspense>
function LoginPageInner() {
  const { login, continueAsGuest } = useAuth();
  const searchParams = useSearchParams();
  const isGuestLimit = searchParams.get("reason") === "guest_limit";

  const [tab, setTab] = useState<Tab>("signin");

  // Sign In fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupDone, setSignupDone] = useState(false);
  const [signupError, setSignupError] = useState("");

  function switchTab(t: Tab) {
    setTab(t);
    setSignupDone(false);
    setSignupError("");
  }

  function handleSignIn() {
    if (!email.trim() || !password.trim()) return;
    // Mock: any non-empty credentials log in as mockUser
    login({
      id: mockUser.id,
      fullName: mockUser.fullName,
      email: email.trim(),
      avatarUrl: mockUser.avatarUrl,
    });
  }

  function handleSignUp() {
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match.");
      return;
    }
    setSignupError("");
    setSignupDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-2 text-xl font-semibold tracking-tight">
          <span className="text-[var(--brand)]">odd</span>
          <span className="text-zinc-900">Academia</span>
        </div>

        {/* Guest limit warning */}
        {isGuestLimit && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You&apos;ve reached your 5 free article limit. Create a free account
            to keep reading.
          </div>
        )}

        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[var(--shadow-md)]">
          {/* Tab switcher */}
          <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={[
                  "flex-1 rounded-lg py-2 text-sm font-medium transition",
                  tab === t
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700",
                ].join(" ")}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Sign In */}
          {tab === "signin" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-zinc-700"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-zinc-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <button
                type="button"
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Forgot password?
              </button>
              <button
                type="submit"
                className="mt-2 h-11 w-full rounded-xl bg-[var(--brand)] text-sm font-medium text-white hover:opacity-95"
              >
                Sign In
              </button>
            </form>
          )}

          {/* Sign Up */}
          {tab === "signup" && !signupDone && (
            <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-zinc-700"
                  htmlFor="fullName"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-zinc-700"
                  htmlFor="signupEmail"
                >
                  Email
                </label>
                <input
                  id="signupEmail"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-zinc-700"
                  htmlFor="signupPassword"
                >
                  Password
                </label>
                <input
                  id="signupPassword"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-zinc-700"
                  htmlFor="signupConfirm"
                >
                  Confirm Password
                </label>
                <input
                  id="signupConfirm"
                  type="password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              {signupError && (
                <p className="text-sm text-red-600">{signupError}</p>
              )}
              <button
                type="submit"
                className="mt-2 h-11 w-full rounded-xl bg-[var(--brand)] text-sm font-medium text-white hover:opacity-95"
              >
                Create Account
              </button>
            </form>
          )}

          {/* Sign Up success state */}
          {tab === "signup" && signupDone && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Check your email to verify your account before logging in.
            </div>
          )}

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100" />
            <span className="text-xs text-zinc-400">or</span>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          {/* Guest entry */}
          <button
            type="button"
            onClick={continueAsGuest}
            className="mt-4 h-11 w-full rounded-xl border border-black/[0.08] text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Continue as Guest →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
