"use client";

import { useRef, useState } from "react";
import { removeProfileAvatar, uploadProfileAvatar } from "@/lib/profile-client";

type Props = {
  avatarUrl?: string;
  onAvatarChange: (url: string | undefined) => void;
  size?: "sm" | "md";
};

const JPEG_ACCEPT = "image/jpeg,.jpg,.jpeg";

export function ProfileAvatarPicker({ avatarUrl, onAvatarChange, size = "md" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const box =
    size === "sm"
      ? "h-16 w-16"
      : "h-20 w-20 sm:h-24 sm:w-24";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    const { avatarUrl: url, error: err } = await uploadProfileAvatar(file);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onAvatarChange(url);
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    const { error: err } = await removeProfileAvatar();
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onAvatarChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className={`${box} overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={JPEG_ACCEPT}
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#2563EB]">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="hover:underline disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload Image"}
        </button>
        {avatarUrl && (
          <>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRemove()}
              className="hover:underline disabled:opacity-50"
            >
              Remove Image
            </button>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">JPEG (.jpg / .jpeg) only, max 2MB</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
