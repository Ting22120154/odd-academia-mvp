"use client";

import { INTEREST_OPTIONS } from "@/lib/interests";

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
};

/** Multi-select interests via dropdown + chips (matches onboarding categories). */
export function InterestCategoryPicker({ selected, onChange }: Props) {
  const available = INTEREST_OPTIONS.filter((o) => !selected.includes(o.label));

  function addInterest(label: string) {
    if (!label || selected.includes(label)) return;
    onChange([...selected, label]);
  }

  function removeInterest(label: string) {
    onChange(selected.filter((i) => i !== label));
  }

  return (
    <div className="space-y-2">
      <select
        value=""
        onChange={(e) => addInterest(e.target.value)}
        className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
        aria-label="Add category of interest"
      >
        <option value="">Select a category…</option>
        {available.map(({ label, emoji }) => (
          <option key={label} value={label}>
            {emoji} {label}
          </option>
        ))}
      </select>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((label) => {
            const opt = INTEREST_OPTIONS.find((o) => o.label === label);
            return (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-medium text-[var(--brand)]"
              >
                {opt ? `${opt.emoji} ` : ""}
                {label}
                <button
                  type="button"
                  onClick={() => removeInterest(label)}
                  className="ml-0.5 hover:opacity-70"
                  aria-label={`Remove ${label}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-zinc-400">Choose at least one category from the list.</p>
      )}
    </div>
  );
}
