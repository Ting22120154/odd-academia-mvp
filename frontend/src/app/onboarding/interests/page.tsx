"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { INTEREST_OPTIONS } from "@/lib/interests";

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("pendingUser")) {
        router.push("/login");
        return;
      }
      setReady(true);
    }
  }, [router]);

  function toggle(label: string) {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  }

  function handleNext() {
    if (selected.length === 0) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("userInterests", JSON.stringify(selected));
    }
    router.push("/onboarding/details");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">
            Choose your interests
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Select topics you want to see in your feed
          </p>
        </div>

        {/* Interest grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {INTEREST_OPTIONS.map(({ label, emoji }) => {
            const isSelected = selected.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggle(label)}
                className={[
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-center leading-tight">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <div className="mt-10 flex flex-col items-end">
          <button
            type="button"
            onClick={handleNext}
            disabled={selected.length === 0}
            className={[
              "w-full rounded-md py-2.5 text-sm font-medium transition-opacity sm:w-auto sm:px-10",
              selected.length === 0
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-[#2563EB] text-white hover:opacity-95",
            ].join(" ")}
          >
            Next →
          </button>
          {selected.length === 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Select at least one interest to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
