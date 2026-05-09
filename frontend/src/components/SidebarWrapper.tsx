"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

// Routes where the sidebar should not render (full-page auth screens)
const SIDEBAR_EXCLUDED = ["/login"];

export function SidebarWrapper() {
  const pathname = usePathname();
  if (SIDEBAR_EXCLUDED.includes(pathname)) return null;
  return <Sidebar />;
}
