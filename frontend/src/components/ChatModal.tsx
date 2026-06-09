"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

type Message = {
  id:        string;
  senderId:  string;
  body:      string;
  isRead:    boolean;
  createdAt: string;
};

type Props = {
  recipientId:   string;
  recipientName: string;
  onClose:       () => void;
};

export function ChatModal({ recipientId, recipientName, onClose }: Props) {
  const { user } = useAuth();
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [draft,     setDraft]     = useState("");
  const [sending,   setSending]   = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/messages?with=${recipientId}`, { credentials: "include" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setLoadError(data?.error ?? `Could not load messages (${res.status}).`);
      return;
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      setLoadError("Invalid response from server.");
      return;
    }
    setLoadError(null);
    setMessages(data as Message[]);
  }, [user, recipientId]);

  // Initial load
  useEffect(() => {
    void fetchMessages();
    inputRef.current?.focus();
  }, [fetchMessages]);

  // Poll for new messages every 3 seconds while the chat is open
  useEffect(() => {
    const interval = setInterval(() => { void fetchMessages(); }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!user || !draft.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ recipientId, body: draft.trim() }),
      });
      if (res.ok) {
        setDraft("");
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        setSendError(data?.error ?? "Failed to send message.");
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={onClose}
      />

      {/* Chat window */}
      <div className="relative pointer-events-auto w-full max-w-sm sm:max-w-md flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
           style={{ height: "min(520px, 80vh)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-black/[0.06] bg-white px-4 py-3 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-sm font-bold text-white flex-shrink-0">
            {recipientName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-zinc-900 truncate">{recipientName}</div>
            <div className="text-xs text-green-500">Active</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Security notice — messages are protected by HTTPS in transit and
            encrypted at rest by Neon PostgreSQL. */}
        <p className="border-b border-black/[0.04] bg-zinc-50 px-4 py-1.5 text-center text-[11px] text-zinc-400 flex-shrink-0">
          Messages are private and secured by HTTPS.
        </p>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-zinc-50">
          {loadError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
              {loadError}
            </div>
          )}
          {!loadError && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-400">No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((m) => {
            const isMine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isMine
                      ? "bg-[var(--brand)] text-white rounded-br-sm"
                      : "bg-white text-zinc-800 shadow-sm border border-black/[0.06] rounded-bl-sm",
                  ].join(" ")}
                >
                  <p>{m.body}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? "text-white/60" : "text-zinc-400"} text-right`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Error banner */}
        {sendError && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 flex-shrink-0">
            <p className="text-xs text-red-600">{sendError}</p>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-black/[0.06] bg-white px-3 py-3 flex-shrink-0">
          {!user ? (
            <p className="text-xs text-zinc-400 text-center w-full">Log in to send messages.</p>
          ) : (
            <>
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="flex-1 h-10 rounded-xl border border-black/[0.08] bg-zinc-50 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[var(--brand)] focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!draft.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
