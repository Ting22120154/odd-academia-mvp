"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatModal } from "@/components/ChatModal";
import {
  fetchInbox,
  type InboxConversation,
} from "@/lib/messages-client";

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{
    partnerId: string;
    partnerName: string;
  } | null>(null);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    const { conversations: rows, error: err } = await fetchInbox();
    if (err) setError(err);
    else {
      setConversations(rows ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    void loadInbox();
  }, [isLoggedIn, router, loadInbox]);

  useEffect(() => {
    const withId = searchParams.get("with");
    const name = searchParams.get("name");
    if (!withId || loading) return;
    const match = conversations.find((c) => c.partnerId === withId);
    setActiveChat({
      partnerId: withId,
      partnerName: name ?? match?.partnerName ?? "User",
    });
  }, [searchParams, loading, conversations]);

  function openChat(partnerId: string, partnerName: string) {
    setActiveChat({ partnerId, partnerName });
  }

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900">Messages</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Your conversations with other users.
      </p>

      {loading ? (
        <p className="mt-8 text-center text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-center text-sm text-red-600">{error}</p>
      ) : conversations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-[var(--shadow-sm)]">
          <p className="text-sm text-zinc-500">No messages yet.</p>
          <p className="mt-2 text-xs text-zinc-400">
            Visit a user profile and click Message to start a chat.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
          {conversations.map((c) => (
            <li key={c.partnerId}>
              <button
                type="button"
                onClick={() => openChat(c.partnerId, c.partnerName)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-zinc-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-sm font-bold text-white">
                  {c.partnerName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-900">
                      {c.partnerName}
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-400">
                      {new Date(c.lastAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {c.isSent ? `You: ${c.lastMessage}` : c.lastMessage}
                  </p>
                </div>
                {c.unread > 0 ? (
                  <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[10px] font-bold text-white">
                    {c.unread}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      {activeChat ? (
        <ChatModal
          recipientId={activeChat.partnerId}
          recipientName={activeChat.partnerName}
          onClose={() => {
            setActiveChat(null);
            void loadInbox();
          }}
        />
      ) : null}
    </section>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesPageInner />
    </Suspense>
  );
}
