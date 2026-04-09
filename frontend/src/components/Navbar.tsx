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
  { href: "/home", label: "Home" },
  { href: "/upload", label: "Upload paper" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
];

function Icon({ name }: { name: "home" | "upload" | "bell" | "user" }) {
  // Minimal inline icons (no dependency). Style is intentionally simple for MVP.
  const common = "h-5 w-5";
  switch (name) {
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "upload":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 16V4m0 0 4 4M12 4 8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 20h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bell":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 19a2.5 2.5 0 0 0 5 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "user":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M20 21a8 8 0 1 0-16 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

export function Navbar() {
  return (
    <header className="border-b border-black/10 bg-white px-4 py-3">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-4">
        {/* Figma-style wordmark: “odd” in brand blue, “Academia” in dark text */}
        <div className="font-semibold tracking-tight">
          <span className="text-[#0066FF]">odd</span>
          <span className="text-zinc-900">Academia</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-black"
            >
              <span className="text-zinc-500">
                {item.href === "/home" ? (
                  <Icon name="home" />
                ) : item.href === "/upload" ? (
                  <Icon name="upload" />
                ) : item.href === "/notifications" ? (
                  <Icon name="bell" />
                ) : (
                  <Icon name="user" />
                )}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

