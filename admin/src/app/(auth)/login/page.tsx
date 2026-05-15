"use client";

/**
 * Admin Login Page
 *
 * Layout: split-screen — blue branding panel on the left (hidden on mobile),
 * login form on the right.
 *
 * Flow:
 *  1. User submits email + password
 *  2. POST /api/auth/login — server checks hardcoded credentials and sets
 *     the oa_admin_token httpOnly cookie on success
 *  3. On success → router.push("/dashboard")
 *  4. On failure → inline error message shown under the form
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // Form field state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI feedback state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Sends credentials to the login API route.
   * The API sets the session cookie; on success we navigate to the dashboard.
   */
  async function handleLogin() {
    // Client-side guard — prevents an empty request hitting the server
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Show the server-returned error message (e.g. "Invalid email or password.")
        setError(data.error ?? "Login failed.");
        return;
      }

      // Cookie is now set by the server response — navigate to the dashboard
      router.push("/dashboard");
    } catch {
      // Network-level failure (server down, no connection, etc.)
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel (hidden below lg breakpoint) ── */}
      <div className="hidden lg:flex w-[30%] flex-col items-center justify-center bg-[#0066ff] text-white p-12">
        <div className="text-3xl font-bold mb-1">
          <span>odd</span>
          <span className="font-light">Academia</span>
        </div>
        <p className="text-blue-200 text-sm mb-12">Admin Panel</p>

        {/* Decorative wave SVG — purely visual */}
        <svg viewBox="0 0 400 260" fill="none" className="w-full max-w-xs opacity-40">
          <path d="M0 130 Q50 80 100 130 Q150 180 200 130 Q250 80 300 130 Q350 180 400 130" stroke="white" strokeWidth="3" fill="none"/>
          <path d="M0 160 Q50 110 100 160 Q150 210 200 160 Q250 110 300 160 Q350 210 400 160" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M0 100 Q50 50 100 100 Q150 150 200 100 Q250 50 300 100 Q350 150 400 100" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="100" cy="130" r="6" fill="white" opacity="0.6"/>
          <circle cx="200" cy="130" r="6" fill="white" opacity="0.6"/>
          <circle cx="300" cy="130" r="6" fill="white" opacity="0.6"/>
        </svg>
      </div>

      {/* ── Right login form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your admin account to continue
            </p>
          </div>

          {/* Error banner — only rendered when there is an error message */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="admin@oddacademia.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#0066ff" } as React.CSSProperties}
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#0066ff" } as React.CSSProperties}
              />
            </div>

            {/* Submit button — disabled while the API call is in-flight */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#0066ff" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
