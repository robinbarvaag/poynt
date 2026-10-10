"use client";

import {
  accountMenuItem,
  businessNavItems,
  homeNavItem,
  learnNavItems,
  toolNavItems,
  toolboxNavItems,
} from "@/lib/constants";
import { SidebarTrigger } from "@poynt/ui";
import { usePathname } from "next/navigation";
import { NotificationBell } from "../community/notification-bell";
import { SearchCommand } from "./search-command";

// Ruter som ikke er i sidebar-navet, men som trenger en tittel i headeren.
const extraTitles: { url: string; title: string }[] = [
  { url: "/on-poynt/admin", title: "Admin" },
];

const titleEntries = [
  homeNavItem,
  ...toolNavItems,
  ...toolboxNavItems,
  ...learnNavItems,
  ...businessNavItems,
  accountMenuItem,
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
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-foreground/10 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <span className="font-medium text-sm">{pageTitle(pathname)}</span>
      <div className="ml-auto flex items-center gap-1" data-tour="search">
        <SearchCommand />
        <NotificationBell />
      </div>
    </header>
  );
}
