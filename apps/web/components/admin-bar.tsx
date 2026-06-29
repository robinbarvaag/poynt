"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@poynt/ui";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type AdminBarProps =
  | {
      /** Payload-collection-slug, f.eks. "guides" */
      collection: string;
      /** Dokument-ID for "Rediger"-lenken */
      id: string;
      /** Ental i knappetekst, f.eks. "guide" → "Rediger guide" */
      singular?: string;
      global?: never;
    }
  | {
      /** Payload-global-slug, f.eks. "homepage" (forside/listesider) */
      global: string;
      singular?: string;
      collection?: never;
      id?: never;
    };

type MeUser = { id: string; email?: string } | null;

const COLLAPSE_KEY = "poynt-adminbar-collapsed";

/**
 * Egenbygd, flytende admin-stripe som KUN vises når en innlogget
 * Payload-admin besøker siden. Vi gjør samme same-origin-sjekk som den
 * offisielle pakken (`/api/users/me` med cookie `payload-token`) og
 * rendrer `null` for alle andre — inkludert On Poynt-medlemmer på
 * Better Auth.
 *
 * I motsetning til `@payloadcms/admin-bar` legger denne seg som en
 * flytende pille nederst til høyre (over innholdet, ikke en fixed topp-
 * stripe som dekker hero-en), er på norsk og følger Poynt-fargene. Kan
 * minimeres til en liten knapp (huskes i localStorage).
 */
export function AdminBar(props: AdminBarProps) {
  const [user, setUser] = useState<MeUser | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(
      typeof window !== "undefined" &&
        window.localStorage.getItem(COLLAPSE_KEY) === "1"
    );
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/users/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!user) return null;

  const editHref = props.global
    ? `/admin/globals/${props.global}`
    : `/admin/collections/${props.collection}/${props.id}`;
  const label = props.singular ?? "denne siden";

  const setCollapsedPersisted = (next: boolean) => {
    setCollapsed(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsedPersisted(false)}
        aria-label="Vis admin-verktøy"
        className="fixed right-6 bottom-6 z-50 flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-1 ring-black/10 transition hover:scale-105 print:hidden"
      >
        <Pencil className="size-4" />
      </button>
    );
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 print:hidden">
      <div className="flex items-center gap-1 rounded-full bg-foreground p-1 pl-3 text-background shadow-lg ring-1 ring-black/10 backdrop-blur">
        <span className="pr-1 pl-1 font-medium text-background/70 text-xs">
          Admin
        </span>

        <a
          href={editHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 font-medium text-foreground text-sm transition hover:bg-background/90"
        >
          <Pencil className="size-3.5" />
          Rediger {label}
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Flere admin-valg"
            className="flex size-8 items-center justify-center rounded-full text-background/80 transition hover:bg-background/10 hover:text-background"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            {user.email && (
              <>
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground text-xs">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <a href={editHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Åpne i admin
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/admin">
                <LayoutDashboard className="size-4" />
                Admin-dashbord
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/logout">
                <LogOut className="size-4" />
                Logg ut
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => setCollapsedPersisted(true)}
          aria-label="Skjul admin-verktøy"
          className="flex size-8 items-center justify-center rounded-full text-background/60 transition hover:bg-background/10 hover:text-background"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
