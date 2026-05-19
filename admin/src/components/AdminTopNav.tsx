"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { mockFlaggedComments } from "@odd-academia/db";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Papers",    href: "/papers"    },
  { label: "Users",     href: "/users"     },
  { label: "Reports",   href: "/reports"   },
  { label: "Account",   href: "/account"   },
];

export default function AdminTopNav() {
  const pathname = usePathname();

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between">

        {/* Logo */}
        <span className="text-lg font-bold tracking-tight select-none">
          <span style={{ color: "#0066ff" }}>odd</span>
          <span className="text-gray-900">Academia</span>
        </span>

        {/* Nav links + bell */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-[#0066ff] text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Notification bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(o => !o)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Reported comments"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {mockFlaggedComments.length}
              </span>
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Reported Comments</p>
                  <p className="text-xs text-gray-400">{mockFlaggedComments.length} pending review</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {mockFlaggedComments.map(c => (
                    <div key={c.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{c.author}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{c.text}</p>
                        </div>
                        <Link
                          href={`/papers/${c.paperId}`}
                          onClick={() => setBellOpen(false)}
                          className="text-xs text-[#0066ff] hover:underline flex-shrink-0"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
