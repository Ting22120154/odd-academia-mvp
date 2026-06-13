"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaperContributorDisplay } from "@/lib/papers/contributors";

type SearchUser = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
};

type Props = {
  value: PaperContributorDisplay[];
  onChange: (next: PaperContributorDisplay[]) => void;
  excludeUserId?: string;
};

function contributorKey(c: PaperContributorDisplay): string {
  return c.userId ?? c.label.toLowerCase();
}

function hasContributor(list: PaperContributorDisplay[], next: PaperContributorDisplay): boolean {
  const key = contributorKey(next);
  return list.some((c) => contributorKey(c) === key);
}

export function ContributorPicker({ value, onChange, excludeUserId }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const addContributor = useCallback(
    (tag: PaperContributorDisplay) => {
      if (!tag.label.trim()) return;
      if (hasContributor(value, tag)) return;
      onChange([...value, tag]);
      setInput("");
      setOpen(false);
      setResults([]);
    },
    [onChange, value],
  );

  const removeContributor = useCallback(
    (tag: PaperContributorDisplay) => {
      const key = contributorKey(tag);
      onChange(value.filter((c) => contributorKey(c) !== key));
    },
    [onChange, value],
  );

  useEffect(() => {
    const q = input.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const res = await fetch(
            `/api/users/search?q=${encodeURIComponent(q)}&limit=8`,
            { credentials: "include" },
          );
          const json = (await res.json()) as
            | { success: true; data: { users: SearchUser[] } }
            | { success: false };
          if (json.success) {
            const users = json.data.users.filter((u) => u.id !== excludeUserId);
            setResults(users);
            setOpen(users.length > 0);
          } else {
            setResults([]);
          }
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, excludeUserId]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (results.length === 1) {
      const u = results[0];
      addContributor({
        label: u.fullName,
        userId: u.id,
        avatarUrl: u.avatarUrl,
      });
      return;
    }
    addContributor({ label: trimmed });
  }

  return (
    <div ref={wrapRef} className="space-y-2">
      <div className="relative">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search @username or press Enter for external name"
          className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {open && (searching || results.length > 0) ? (
          <ul
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg"
            role="listbox"
          >
            {searching && results.length === 0 ? (
              <li className="px-4 py-2 text-xs text-zinc-400">Searching…</li>
            ) : null}
            {results.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-zinc-50"
                  onClick={() =>
                    addContributor({
                      label: u.fullName,
                      userId: u.id,
                      avatarUrl: u.avatarUrl,
                    })
                  }
                >
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-cover bg-zinc-100"
                    />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-500">
                      {u.fullName.charAt(0)}
                    </span>
                  )}
                  <span>
                    <span className="font-medium text-zinc-900">{u.fullName}</span>
                    <span className="ml-1.5 text-zinc-400">@{u.username}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((c) => (
            <span
              key={contributorKey(c)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
            >
              {c.userId && c.avatarUrl ? (
                <img src={c.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : null}
              {c.userId ? (
                <a href={`/user/${c.userId}`} className="hover:underline">
                  {c.label}
                </a>
              ) : (
                c.label
              )}
              <button
                type="button"
                onClick={() => removeContributor(c)}
                className="text-zinc-500 hover:text-zinc-900"
                aria-label={`Remove ${c.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-400">Optional — tag platform users or add external names.</p>
      )}
    </div>
  );
}
