"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { Icon, type IconName } from "../icons";
import { UILink } from "../lib/link";
import { cn } from "../lib/utils";
import { Container } from "./container";

export interface HubNavItem {
  /** Må matche `id` på tilhørende seksjon i innholdet. */
  id: string;
  label: string;
  icon?: IconName;
}

export interface HubLayoutProps {
  nav: HubNavItem[];
  /** Overskrift over menyen. Default «På denne siden». */
  navTitle?: string;
  /** Valgfritt innhold under menyen på desktop (kontaktkort, «sist oppdatert»). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Posisjonsbasert scroll-spy: aktiv seksjon = den siste hvis topp har passert
 * en linje nær toppen. Robust når man klikker og hopper rett til en seksjon
 * (IntersectionObserver-bånd bommer da).
 */
function useActiveSection(items: HubNavItem[], offset = 140) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
      if (items.length === 0) return;
      let current = items[0]?.id;
      for (const item of items) {
        const node = document.getElementById(item.id);
        if (node && node.getBoundingClientRect().top - offset <= 0) {
          current = item.id;
        }
      }
      setActiveId(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items, offset]);

  return { activeId, progress };
}

/** Sticky sidemeny (desktop). */
function HubRail({
  items,
  title,
  activeId,
}: {
  items: HubNavItem[];
  title: string;
  activeId?: string;
}) {
  return (
    <nav aria-label={title} className="flex flex-col">
      <span className="mb-3 px-3 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
        {title}
      </span>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <UILink
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors duration-200",
                  active
                    ? "bg-primary/10 font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                {item.icon ? (
                  <Icon
                    name={item.icon}
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full transition-colors",
                      active ? "bg-primary" : "bg-foreground/25"
                    )}
                  />
                )}
                <span className="leading-snug">{item.label}</span>
              </UILink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sticky topplinje med nedtrekk (mobil). */
function HubBar({
  items,
  title,
  activeId,
  progress,
}: {
  items: HubNavItem[];
  title: string;
  activeId?: string;
  progress: number;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const current = items.find((i) => i.id === activeId) ?? items[0];

  return (
    <div
      // Fester seg rett under sidens header når den finnes: `SiteHeader`
      // publiserer sin høyde som `--site-header-offset` (4rem synlig, 0 når
      // den har skjult seg ved scroll nedover). Baren følger med i samme
      // tempo/kurve som headeren, så de beveger seg som én enhet. Uten
      // header (Storybook, andre flater) er offset 0 = som før.
      className="sticky z-40 transition-[top] duration-300 ease-drawer motion-reduce:transition-none lg:hidden"
      style={{ top: "var(--site-header-offset, 0px)" }}
    >
      <div className="border-primary/15 border-b bg-background/95 shadow-[0_12px_32px_-20px_rgba(0,64,41,0.45)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
          aria-expanded={open}
          aria-controls={menuId}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_rgba(0,64,41,0.6)]">
            <Icon name={current?.icon ?? "layers"} className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-heading font-semibold text-[0.65rem] text-primary uppercase tracking-[0.16em]">
              {title}
            </span>
            <span className="truncate font-heading font-semibold text-[0.95rem] text-foreground">
              {current?.label}
            </span>
          </span>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-foreground transition-colors",
              open && "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <Icon name="chevrons-up-down" className="size-4" />
          </span>
        </button>
        <div className="h-1 bg-primary/10">
          <div
            className="h-full rounded-r-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {open && (
        <div
          id={menuId}
          className="absolute inset-x-0 top-full border-foreground/10 border-b bg-background shadow-[0_20px_40px_-20px_rgba(0,64,41,0.35)]"
        >
          <ul className="flex flex-col p-2">
            {items.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <UILink
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                      active
                        ? "bg-primary/10 font-semibold text-foreground"
                        : "text-muted-foreground active:bg-foreground/5"
                    )}
                  >
                    {item.icon ? (
                      <Icon
                        name={item.icon}
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          active ? "bg-primary" : "bg-foreground/25"
                        )}
                      />
                    )}
                    {item.label}
                  </UILink>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Oversiktsside med sidemeny: innholdet i én kolonne, en sticky meny til
 * venstre på desktop som følger med når du scroller, og en sticky topplinje
 * med nedtrekk på mobil. Menyen peker på #ankre i innholdet — så alt som
 * trengs er at hver seksjon har en `id`.
 *
 * Ulikt `SectionRail` (guider) er den IKKE nummerert: en ressursside er et
 * kart, ikke en oppskrift — du skal kunne hoppe rett til «Prompter».
 */
export function HubLayout({
  nav,
  navTitle = "På denne siden",
  aside,
  children,
  className,
}: HubLayoutProps) {
  const { activeId, progress } = useActiveSection(nav);
  const hasNav = nav.length > 0;

  return (
    <div className={cn("relative", className)}>
      {hasNav && (
        <HubBar
          items={nav}
          title={navTitle}
          activeId={activeId}
          progress={progress}
        />
      )}
      <Container size="lg" padding="none">
        <div
          className={cn(
            "grid grid-cols-1 gap-10",
            hasNav && "lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14"
          )}
        >
          {hasNav && (
            <aside className="hidden lg:block">
              <div className="sticky top-28 flex flex-col gap-8 py-12">
                <HubRail items={nav} title={navTitle} activeId={activeId} />
                {aside}
              </div>
            </aside>
          )}
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </div>
  );
}
