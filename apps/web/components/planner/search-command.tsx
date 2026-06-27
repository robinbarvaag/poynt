"use client";

import {
  type NavItem,
  accountMenuItem,
  businessNavItems,
  homeNavItem,
  learnNavItems,
  toolNavItems,
  toolboxNavItems,
} from "@/lib/constants";
import { Dialog, DialogContent, DialogTitle, cn } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Speiler responsen fra /api/on-poynt/search-index. */
type SearchIndexItem = { title: string; href: string; format: ContentFormat };
type ContentFormat = "guide" | "artikkel" | "kurs";

type Hit = { title: string; href: string; icon: IconName; group: string };

// Statiske sider/verktøy — bygges én gang fra nav-konstantene.
function pageHit(item: NavItem, group: string): Hit {
  return { title: item.title, href: item.url, icon: item.icon, group };
}
const PAGE_HITS: Hit[] = [
  pageHit(homeNavItem, "Sider"),
  ...toolNavItems.map((i) => pageHit(i, "Verktøy")),
  ...toolboxNavItems.map((i) => pageHit(i, "Verktøykassa")),
  ...learnNavItems.map((i) => pageHit(i, "Læring")),
  ...businessNavItems.map((i) => pageHit(i, "Din bedrift")),
  pageHit(accountMenuItem, "Konto"),
];

const FORMAT_ICON: Record<SearchIndexItem["format"], IconName> = {
  guide: "compass",
  artikkel: "newspaper",
  kurs: "graduation-cap",
};

/**
 * Globalt ⌘K-søk for On Poynt. Knappen i headeren eller ⌘K/Ctrl+K åpner paletten.
 * Søker umiddelbart i sider/verktøy (statisk) og i alt Læring-innhold (hentes
 * lazy fra /api/on-poynt/search-index første gang og caches). Pil opp/ned
 * navigerer, Enter går dit, Esc lukker.
 */
export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform || navigator.userAgent));
  }, []);

  const load = useCallback(async () => {
    if (content || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/on-poynt/search-index");
      if (res.ok) {
        const data = (await res.json()) as { items: SearchIndexItem[] };
        setContent(
          data.items.map((i) => ({
            title: i.title,
            href: i.href,
            icon: FORMAT_ICON[i.format],
            group: "Læring",
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [content, loading]);

  // ⌘K / Ctrl+K toggler paletten fra hvor som helst.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      void load();
      setQ("");
      setActive(0);
    }
  }, [open, load]);

  const query = q.trim().toLowerCase();

  // Flat, ordnet trefliste (for tastaturnavigering) + gruppert visning.
  const hits = useMemo(() => {
    const all = query ? [...PAGE_HITS, ...(content ?? [])] : PAGE_HITS;
    return query
      ? all.filter((h) => h.title.toLowerCase().includes(query))
      : all;
  }, [query, content]);

  const groups = useMemo(() => {
    const order = [
      "Sider",
      "Verktøy",
      "Verktøykassa",
      "Læring",
      "Din bedrift",
      "Konto",
    ];
    const map = new Map<string, Hit[]>();
    for (const h of hits) {
      const arr = map.get(h.group) ?? [];
      arr.push(h);
      map.set(h.group, arr);
    }
    return order
      .filter((g) => map.has(g))
      .map((g) => ({ label: g, items: map.get(g) ?? [] }));
  }, [hits]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit.href);
    }
  };

  // Løpende global indeks på tvers av grupper (for aktiv-uthevingen).
  let runningIndex = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-foreground/10 bg-muted/40 px-2.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Søk"
        title="Søk (⌘K)"
      >
        <Icon name="search" className="size-4 shrink-0" />
        <span className="hidden sm:inline">Søk …</span>
        <kbd className="hidden h-5 select-none items-center rounded border border-foreground/10 bg-background px-1.5 font-medium text-[11px] text-muted-foreground leading-none sm:inline-flex">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Søk i On Poynt</DialogTitle>

          <div className="flex items-center gap-2 border-foreground/10 border-b px-3">
            <Icon
              name="search"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Søk etter sider, verktøy og innhold …"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div ref={listRef} className="max-h-85 overflow-y-auto p-1">
            {loading && !content && (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                <Icon name="loader" className="size-4 animate-spin" /> Laster …
              </div>
            )}

            {hits.length === 0 && !loading && (
              <p className="py-8 text-center text-muted-foreground text-sm">
                {q ? `Ingen treff på «${q}».` : "Ingenting å vise."}
              </p>
            )}

            {groups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <p className="px-3 pt-2 pb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                  {group.label}
                </p>
                {group.items.map((hit) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  return (
                    <button
                      key={hit.href}
                      type="button"
                      data-idx={idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(hit.href)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm",
                        idx === active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground"
                      )}
                    >
                      <Icon
                        name={hit.icon}
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="truncate">{hit.title}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 border-foreground/10 border-t px-3 py-2 text-[11px] text-muted-foreground">
            <span>↑↓ naviger</span>
            <span>↵ gå dit</span>
            <span>esc lukk</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
