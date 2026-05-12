"use client";

/**
 * AdminTopNav
 * Horizontal top navigation bar matching the Figma design.
 * Logo on the left, nav links on the right.
 * Active link is shown as a filled blue pill.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Papers",    href: "/papers" },
  { label: "Users",     href: "/users" },
  { label: "Account",   href: "/account" },
];

export default function AdminTopNav() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between">

      {/* Logo */}
      <span className="text-lg font-bold tracking-tight select-none">
        <span style={{ color: "#0066ff" }}>odd</span>
        <span className="text-gray-900">Academia</span>
      </span>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-[#0066ff] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
