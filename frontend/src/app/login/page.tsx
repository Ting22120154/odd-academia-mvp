"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { mockUser } from "@/data/mockUser";

type Mode = "login" | "signup";

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function LeftPanel() {
  return (
    <div className="relative hidden w-[30%] min-w-[280px] overflow-hidden bg-[#2563EB] lg:flex lg:flex-col">
      {/* Logo */}
      <div className="relative z-10 p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/odd-academia_logo.svg"
          alt="odd Academia"
          className="h-7 w-auto"
        />
      </div>

      {/* Decorative circles */}
      <div
        className="absolute rounded-full border-2 border-white/20"
        style={{ width: 420, height: 420, bottom: -120, left: -100 }}
      />
      <div
        className="absolute rounded-full border-2 border-white/20"
        style={{ width: 300, height: 300, bottom: -60, left: 60 }}
      />
    </div>
  );
}

function LoginPageInner() {
  const { login, continueAsGuest } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isGuestLimit = searchParams.get("reason") === "guest_limit";

  const [mode, setMode] = useState<Mode>("login");
  const [linkedinNotice, setLinkedinNotice] = useState(false);

  // Login fields + errors
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Signup fields + errors
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<{
    fullName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function switchMode(next: Mode) {
    setMode(next);
    setLinkedinNotice(false);
    setLoginErrors({});
    setSignupErrors({});
  }

  function handleLogin() {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = "Email is required.";
    if (!password.trim()) errs.password = "Password is required.";
    if (Object.keys(errs).length > 0) {
      setLoginErrors(errs);
      return;
    }
    setLoginErrors({});
    login({
      id: mockUser.id,
      fullName: mockUser.fullName,
      email: email.trim(),
      avatarUrl: mockUser.avatarUrl,
    });
  }

  function handleSignup() {
    const errs: typeof signupErrors = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!username.trim()) errs.username = "Username is required.";
    if (!signupEmail.trim()) errs.email = "Email is required.";
    if (!signupPassword.trim()) errs.password = "Password is required.";
    if (!confirmPassword.trim()) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (signupPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(errs).length > 0) {
      setSignupErrors(errs);
      return;
    }
    setSignupErrors({});
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pendingUser",
        JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
        })
      );
    }
    router.push("/onboarding/interests");
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const inputErrorClass =
    "w-full border border-red-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";
  const primaryBtnClass =
    "w-full bg-[#2563EB] text-white rounded-md py-2.5 text-sm font-medium hover:opacity-95 transition-opacity";
  const linkedinBtnClass =
    "w-full flex items-center justify-center gap-2 border border-[#2563EB] bg-white text-[#2563EB] rounded-md py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors";
  const guestBtnClass =
    "w-full rounded-md border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors";

  return (
    <div className="flex min-h-screen">
      <LeftPanel />

      {/* Right panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Top-right corner link — signup mode only */}
        {mode === "signup" && (
          <div className="absolute right-6 top-6">
            <span className="text-sm text-gray-500">Already have an account? </span>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-sm font-medium text-[#2563EB] hover:underline"
            >
              Log in
            </button>
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Guest limit banner */}
          {isGuestLimit && (
            <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You&apos;ve reached your 5 free article limit. Sign up or log in to keep reading.
            </div>
          )}

          {/* ===== LOGIN MODE ===== */}
          {mode === "login" && (
            <>
              <h1 className="mb-8 text-2xl font-semibold text-gray-900">
                Log in to Odd Academia
              </h1>

              <button
                type="button"
                onClick={() => setLinkedinNotice(true)}
                className={linkedinBtnClass}
              >
                <LinkedInIcon />
                Login with LinkedIn
              </button>
              {linkedinNotice && (
                <p className="mt-2 text-center text-xs text-blue-600">
                  LinkedIn login coming soon — use email below for now.
                </p>
              )}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">Or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder="you@example.com"
                    className={loginErrors.email ? inputErrorClass : inputClass}
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{loginErrors.email}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    className={loginErrors.password ? inputErrorClass : inputClass}
                  />
                  {loginErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{loginErrors.password}</p>
                  )}
                </div>
                <button type="submit" className={primaryBtnClass}>
                  Login
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-medium text-[#2563EB] hover:underline"
                >
                  Create account
                </button>
              </p>

              <div className="mt-6 h-px bg-gray-200" />
              <button type="button" onClick={continueAsGuest} className={guestBtnClass + " mt-4"}>
                Continue as Guest →
              </button>
            </>
          )}

          {/* ===== SIGNUP MODE ===== */}
          {mode === "signup" && (
            <>
              <h1 className="mb-8 text-2xl font-semibold text-gray-900">
                Welcome to Odd Academia
              </h1>

              <button
                type="button"
                onClick={() => setLinkedinNotice(true)}
                className={linkedinBtnClass}
              >
                <LinkedInIcon />
                Sign up with LinkedIn
              </button>
              {linkedinNotice && (
                <p className="mt-2 text-center text-xs text-blue-600">
                  LinkedIn sign-up coming soon — use email below for now.
                </p>
              )}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">Or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); handleSignup(); }}
                className="space-y-4"
              >
                {/* Full Name + Username */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setSignupErrors((p) => ({ ...p, fullName: undefined })); }}
                      placeholder="Jane Smith"
                      className={signupErrors.fullName ? inputErrorClass : inputClass}
                    />
                    {signupErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600">{signupErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setSignupErrors((p) => ({ ...p, username: undefined })); }}
                      placeholder="janesmith"
                      className={signupErrors.username ? inputErrorClass : inputClass}
                    />
                    {signupErrors.username && (
                      <p className="mt-1 text-xs text-red-600">{signupErrors.username}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="signupEmail" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="signupEmail"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => { setSignupEmail(e.target.value); setSignupErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder="you@example.com"
                    className={signupErrors.email ? inputErrorClass : inputClass}
                  />
                  {signupErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{signupErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signupPassword" className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="signupPassword"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => { setSignupPassword(e.target.value); setSignupErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    className={signupErrors.password ? inputErrorClass : inputClass}
                  />
                  {signupErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{signupErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setSignupErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                    placeholder="••••••••"
                    className={signupErrors.confirmPassword ? inputErrorClass : inputClass}
                  />
                  {signupErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{signupErrors.confirmPassword}</p>
                  )}
                </div>

                <button type="submit" className={primaryBtnClass}>
                  Create Account
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-400">
                By signing up, you agree to our{" "}
                <a href="#" className="underline hover:text-gray-600">Terms</a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>
              </p>

              <div className="mt-6 h-px bg-gray-200" />
              <button type="button" onClick={continueAsGuest} className={guestBtnClass + " mt-4"}>
                Continue as Guest →
              </button>
            </>
          )}
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
