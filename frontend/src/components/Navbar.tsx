import Link from "next/link";

/**
 * Global navigation for the MVP.
 *
 * Intent:
 * - Provide a stable set of routes so each member can implement their page independently.
 * - Keep links explicit (no auth gating yet) to simplify early integration/testing.
 *
 * When auth is implemented, we can conditionally hide/show items (e.g. Login vs Profile)
 * based on session state.
 */
const navItems = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/profile", label: "Profile" },
  { href: "/login", label: "Login" },
];

export function Navbar() {
  return (
    <header className="border-b border-black/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-black">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-4">
        {/* Figma-style wordmark: “odd” in brand blue, “Academia” in dark text */}
        <div className="font-semibold tracking-tight">
          <span className="text-[#0066FF]">odd</span>
          <span className="text-zinc-900 dark:text-white">Academia</span>
        </div>
        <div className="flex items-center gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

