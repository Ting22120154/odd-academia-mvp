"use client";

import { useRef, useState } from "react";

type Props = {
  paperId: string;
  onAttached?: () => void;
};

export function PaperPdfAttach({ paperId, onAttached }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChooseFile(file: File | null) {
    if (!file) return;
    setError(null);

    const name = file.name.toLowerCase();
    if (file.type !== "application/pdf" && !name.endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("PDF must be 10MB or smaller.");
      return;
    }

    const uploadFile =
      file.type === "application/pdf"
        ? file
        : new File([file], file.name, { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("paperId", paperId);

    setUploading(true);
    try {
      const res = await fetch("/api/papers/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(body?.error ?? "Upload failed");
        return;
      }
      onAttached?.();
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-[var(--shadow-sm)]">
      <p className="text-sm font-medium text-amber-900">PDF not available</p>
      <p className="mt-1 text-sm text-amber-800/90">
        The file is missing or failed to upload. Attach a PDF to view it here.
      </p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-6 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload PDF"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => void onChooseFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
