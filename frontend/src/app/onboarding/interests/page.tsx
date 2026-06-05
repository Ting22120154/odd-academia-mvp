"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterestPicker } from "@/components/profile/InterestPicker";
import { updateMyProfile } from "@/lib/profile-client";

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("pendingUser")) {
      router.push("/login");
      return;
    }
    try {
      const raw = localStorage.getItem("userInterests");
      if (raw) setSelected(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
    setReady(true);
  }, [router]);

  async function handleNext() {
    if (selected.length === 0) return;
    setError(null);
    setSaving(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("userInterests", JSON.stringify(selected));
    }

    const { error: err } = await updateMyProfile({ interests: selected });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }

    router.push("/onboarding/details");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Choose your interests</h1>
          <p className="mt-2 text-sm text-gray-500">Select topics you want to see in your feed</p>
        </div>

        <InterestPicker selected={selected} onChange={setSelected} />

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        <div className="mt-10 flex flex-col items-end">
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={selected.length === 0 || saving}
            className={[
              "w-full rounded-md py-2.5 text-sm font-medium transition-opacity sm:w-auto sm:px-10",
              selected.length === 0 || saving
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-[#2563EB] text-white hover:opacity-95",
            ].join(" ")}
          >
            {saving ? "Saving…" : "Next →"}
          </button>
          {selected.length === 0 && (
            <p className="mt-2 text-xs text-gray-400">Select at least one interest to continue</p>
          )}
        </div>
      </div>
    </div>
  );
}
