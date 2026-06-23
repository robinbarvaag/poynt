"use client";

import {
  accountNavItems,
  homeNavItem,
  learnNavItems,
  toolNavItems,
} from "@/lib/constants";
import { SidebarTrigger } from "@poynt/ui";
import { usePathname } from "next/navigation";

// Ruter som ikke er i sidebar-navet, men som trenger en tittel i headeren.
const extraTitles: { url: string; title: string }[] = [
  { url: "/on-poynt/admin", title: "Admin" },
];

const titleEntries = [
  homeNavItem,
  ...toolNavItems,
  ...learnNavItems,
  ...accountNavItems,
  ...extraTitles,
];

/** Utleder sidetittel: eksakt match, ellers lengste prefiks (for [slug]-sider). */
function pageTitle(pathname: string): string {
  const exact = titleEntries.find((entry) => entry.url === pathname);
  if (exact) return exact.title;

  const prefix = titleEntries
    .filter((entry) => pathname.startsWith(`${entry.url}/`))
    .sort((a, b) => b.url.length - a.url.length)[0];

  return prefix?.title ?? "On Poynt";
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <span className="text-sm font-medium">{pageTitle(pathname)}</span>
    </header>
  );
}
