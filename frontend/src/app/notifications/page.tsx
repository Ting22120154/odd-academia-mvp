"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className="mx-auto w-full max-w-6xl rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-zinc-900">Notifications</h1>
      <p className="mt-2 text-sm text-zinc-500">
        MVP placeholder. Connect to real notification data later.
      </p>
    </div>
  );
}
