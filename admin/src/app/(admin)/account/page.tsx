"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "admin@oddacademia.com";

export default function AccountPage() {
  const router = useRouter();

  const [editing, setEditing] = useState(false);

  // Saved values
  const [email, setEmail]       = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("Admin@1234");

  // Draft values while editing
  const [draftEmail, setDraftEmail]           = useState(ADMIN_EMAIL);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);

  function enterEdit() {
    setDraftEmail(email);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setEditing(true);
  }

  function discard() {
    setEditing(false);
    setError("");
  }

  async function save() {
    const wantsNewPassword = newPassword.length > 0 || confirmPassword.length > 0;

    // Client-side pre-checks to avoid an unnecessary round-trip
    if (wantsNewPassword) {
      if (!currentPassword) {
        setError("Enter your current password to change it.");
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
    }

    setSaving(true);
    setError("");

    const body: Record<string, string> = { currentPassword };
    if (draftEmail !== email)          body.newEmail    = draftEmail;
    if (wantsNewPassword)              body.newPassword = newPassword;

    const res  = await fetch("/api/auth/account", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const json = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to update account.");
      return;
    }

    // Reflect the confirmed changes in local state
    setEmail(draftEmail);
    if (wantsNewPassword) setPassword(newPassword);
    setEditing(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Account
        {editing && (
          <span className="text-gray-400 font-normal"> / Update Details</span>
        )}
      </h1>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Login Details
        </h2>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email
            </label>
            {editing ? (
              <input
                type="email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                className="w-full text-sm text-gray-900 border border-[#0066ff] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#0066ff]/30"
              />
            ) : (
              <p className="text-sm text-gray-900 border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
                {email}
              </p>
            )}
          </div>

          {/* Current Password — required to change password */}
          {editing && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full text-sm text-gray-900 border border-[#0066ff] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#0066ff]/30 placeholder:text-gray-300"
              />
            </div>
          )}

          {/* New Password — only shown in edit mode */}
          {editing && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full text-sm text-gray-900 border border-[#0066ff] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#0066ff]/30 placeholder:text-gray-300"
              />
            </div>
          )}

          {/* Confirm New Password — only shown in edit mode */}
          {editing && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full text-sm text-gray-900 border border-[#0066ff] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#0066ff]/30 placeholder:text-gray-300"
              />
            </div>
          )}

          {/* Current password (view only) */}
          {!editing && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Password
              </label>
              <p className="text-sm text-gray-900 border border-gray-200 rounded-md px-3 py-2 bg-gray-50 tracking-widest">
                ••••••••
              </p>
            </div>
          )}
        </div>

        {/* Validation error */}
        {error && (
          <p className="mt-3 text-xs text-red-600">{error}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          {editing ? (
            <>
              <button
                onClick={discard}
                className="px-5 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 rounded-md text-sm font-medium bg-[#0066ff] text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={enterEdit}
                className="px-5 py-2 rounded-md text-sm font-medium bg-[#0066ff] text-white hover:bg-blue-700 transition-colors"
              >
                Update Details
              </button>
              <button
                onClick={logout}
                className="px-5 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
