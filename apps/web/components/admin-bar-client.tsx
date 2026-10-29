"use client";

import { ANALYTICS_OPT_OUT_KEY } from "@/components/site-analytics";
import { SHARE_CHANNELS, buildShareUrl } from "@/lib/share-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@poynt/ui";
import {
  Check,
  ExternalLink,
  LayoutDashboard,
  Link2,
  LogOut,
  MoreHorizontal,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export type AdminBarProps =
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
 * Klientdelen av admin-stripa. Rendres KUN via server-gaten i admin-bar.tsx
 * (som sjekker at `payload-token`-cookien finnes), og verifiserer deretter
 * tokenet mot `/api/users/me` — så anonyme besøk aldri gjør API-kallet, og
 * et utløpt token aldri viser stripa.
 *
 * I motsetning til `@payloadcms/admin-bar` legger denne seg som en
 * flytende pille nederst til høyre (over innholdet, ikke en fixed topp-
 * stripe som dekker hero-en), er på norsk og følger Poynt-fargene. Kan
 * minimeres til en liten knapp (huskes i localStorage).
 */
export function AdminBarClient(props: AdminBarProps) {
  const [user, setUser] = useState<MeUser | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

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
        // Innlogget admin: ikke tell denne nettleseren i Vercel Analytics.
        if (data?.user) {
          window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
        }
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

  // Delingslenke for siden som vises nå — UTM-merket per kanal
  // (lib/share-link.ts), så vi ser i Vercel hvilken kanal som ga besøk.
  const copyShareLink = async (channelKey: string) => {
    const channel = SHARE_CHANNELS.find((c) => c.key === channelKey);
    if (!channel) return;
    const link = buildShareUrl(window.location.href, channel);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(channel.label);
    } catch {
      window.prompt("Kopier lenken:", link);
      return;
    }
    window.setTimeout(() => setCopied(null), 2500);
  };

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
        className="fixed right-6 bottom-[calc(1.5rem+var(--sticky-bar-height,0px))] z-50 flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-1 ring-black/10 transition hover:scale-105 print:hidden"
      >
        <Pencil className="size-4" />
      </button>
    );
  }

  return (
    <div className="fixed right-6 bottom-[calc(1.5rem+var(--sticky-bar-height,0px))] z-50 print:hidden">
      <div className="flex items-center gap-1 rounded-full bg-foreground p-1 pl-3 text-background shadow-lg ring-1 ring-black/10 backdrop-blur">
        <span className="pr-1 pl-1 font-medium text-background text-xs">
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
            aria-label="Kopier lenke for deling"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-background text-sm transition hover:bg-background/10"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Link2 className="size-3.5" />
            )}
            {copied ? "Kopiert!" : "Del"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64">
            <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
              Hvor skal du dele?
            </DropdownMenuLabel>
            {SHARE_CHANNELS.map((channel) => (
              <DropdownMenuItem
                key={channel.key}
                onSelect={() => void copyShareLink(channel.key)}
                className="flex-col items-start gap-0"
              >
                <span className="font-medium">{channel.label}</span>
                <span className="text-muted-foreground text-xs">
                  {channel.hint}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Flere admin-valg"
            className="flex size-8 items-center justify-center rounded-full text-background transition hover:bg-background/10 hover:text-background"
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
          className="flex size-8 items-center justify-center rounded-full text-background transition hover:bg-background/10 hover:text-background"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
