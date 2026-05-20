"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const MOCK_AUTHOR = {
  fullName: "Evelyn Harper",
  username: "Ev_Harper",
  followers: "1.2k",
  following: 300,
};

export default function MessageAuthorPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();

  const [subject,     setSubject]     = useState("");
  const [message,     setMessage]     = useState("");
  const [linkToPaper, setLinkToPaper] = useState("");
  const [status,      setStatus]      = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg,    setErrorMsg]    = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setErrorMsg("You must be logged in to send a message.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId:    user.id,
          recipientId: id,
          subject,
          body:        message,
          linkToPaper: linkToPaper.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to send message.");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section className="mx-auto w-full max-w-[var(--page-max)]">
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Message sent!</h2>
          <p className="text-sm text-zinc-500">Your message has been delivered to {MOCK_AUTHOR.fullName}.</p>
          <button
            onClick={() => router.back()}
            className="mt-2 inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-8 text-sm font-medium text-white hover:opacity-95"
          >
            Go back
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        <span>←</span> Back
      </button>

      <div className="text-base font-semibold text-zinc-900">Message this Author</div>

      <form
        onSubmit={onSubmit}
        className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]"
      >
        {/* Author banner */}
        <div className="h-28 rounded-t-2xl bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-zinc-200" />
            <div className="pb-1">
              <div className="text-lg font-bold text-zinc-900">{MOCK_AUTHOR.fullName}</div>
              <div className="text-sm text-zinc-500">@{MOCK_AUTHOR.username}</div>
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-500">A message will be sent to their email</p>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>
              <strong className="text-zinc-900">{MOCK_AUTHOR.followers}</strong>{" "}
              <span className="text-zinc-500">followers</span>
            </span>
            <span>
              <strong className="text-zinc-900">{MOCK_AUTHOR.following}</strong>{" "}
              <span className="text-zinc-500">following</span>
            </span>
          </div>

          {status === "error" && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Subject</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                className="min-h-32 w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Link To Paper{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                value={linkToPaper}
                onChange={(e) => setLinkToPaper(e.target.value)}
                placeholder="Enter link"
                className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-8 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Submit"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
