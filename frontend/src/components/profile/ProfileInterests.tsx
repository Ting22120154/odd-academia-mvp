"use client";

import { CATEGORY_EMOJIS } from "@/lib/papers/categoryEmojis";
import type { PaperCategory } from "@/lib/papers/categories";

type Props = {
  interests: string[];
};

function interestEmoji(name: string) {
  if (name in CATEGORY_EMOJIS) return CATEGORY_EMOJIS[name as PaperCategory];
  return "📌";
}

export function ProfileInterests({ interests }: Props) {
  if (interests.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {interests.map((name) => {
        const emoji = interestEmoji(name);
        return (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
          >
            <span>{emoji}</span>
            {name}
          </span>
        );
      })}
    </div>
  );
}
