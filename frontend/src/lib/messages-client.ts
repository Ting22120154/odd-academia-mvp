export type InboxConversation = {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastAt: string;
  isSent: boolean;
  unread: number;
  senderLastMsgRead: boolean;
};

export async function fetchInbox(): Promise<{
  conversations?: InboxConversation[];
  error?: string;
}> {
  const res = await fetch("/api/messages/inbox", { credentials: "include" });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return { error: data?.error ?? `Could not load messages (${res.status}).` };
  }
  const conversations = (await res.json()) as InboxConversation[];
  return { conversations };
}

export async function fetchUnreadMessageCount(): Promise<number> {
  const res = await fetch("/api/messages/unread-count", { credentials: "include" });
  if (!res.ok) return 0;
  const data = (await res.json()) as { count?: number };
  return data.count ?? 0;
}
