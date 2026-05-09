"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

// The paper viewer uses a dedicated layout that matches Figma (no sidebar).
const SIDEBAR_EXCLUDED_PREFIXES = ["/login", "/paper"];

export function SidebarWrapper() {
  const pathname = usePathname();
  if (SIDEBAR_EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <Sidebar />;
}

