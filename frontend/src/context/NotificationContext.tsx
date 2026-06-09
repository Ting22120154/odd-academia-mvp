"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";

type NotificationContextValue = {
  unreadCount: number;
  decrementUnread: () => void;
  decrementUnreadBy: (amount: number) => void;
  resetUnread: () => void;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  decrementUnread: () => {},
  decrementUnreadBy: () => {},
  resetUnread: () => {},
  refreshUnreadCount: async () => {},
});

async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch("/api/notifications/count", { credentials: "include" });
    if (!res.ok) return 0;
    // jsonOk spreads flat: { success: true, count: N }
    const json = (await res.json()) as { success: boolean; count?: number };
    return json.count ?? 0;
  } catch {
    return 0;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }
    const count = await fetchUnreadCount();
    setUnreadCount(count);
  }, [isLoggedIn]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  const decrementUnread = useCallback(() => {
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const decrementUnreadBy = useCallback((amount: number) => {
    if (amount <= 0) return;
    setUnreadCount((c) => Math.max(0, c - amount));
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, decrementUnread, decrementUnreadBy, resetUnread, refreshUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCount() {
  return useContext(NotificationContext);
}
