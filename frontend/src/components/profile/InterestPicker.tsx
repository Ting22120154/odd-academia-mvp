"use client";

import { ONBOARDING_INTEREST_OPTIONS } from "@/lib/papers/categoryEmojis";

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
  /** Smaller grid for edit profile sidebar */
  compact?: boolean;
};

export function InterestPicker({ selected, onChange, compact = false }: Props) {
  function toggle(label: string) {
    onChange(
      selected.includes(label) ? selected.filter((i) => i !== label) : [...selected, label],
    );
  }

  return (
    <div
      className={
        compact
          ? "grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4"
          : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      }
    >
      {ONBOARDING_INTEREST_OPTIONS.map(({ label, emoji }) => {
        const isSelected = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => toggle(label)}
            className={[
              "flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-medium transition-colors",
              compact ? "py-2" : "gap-2 py-4 text-sm",
              isSelected
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            <span className={compact ? "text-lg" : "text-2xl"}>{emoji}</span>
            <span className="text-center leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
