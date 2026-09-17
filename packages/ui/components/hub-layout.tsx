"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../icons";
import { UILink } from "../lib/link";
import { cn } from "../lib/utils";
import { Container } from "./container";

export interface HubNavItem {
  /** Må matche `id` på tilhørende seksjon i innholdet. */
  id: string;
  label: string;
  icon?: IconName;
  /** Kort mengdeangivelse, f.eks. «8 prompter». Vises i menyen. */
  meta?: string;
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
 *
 * Følger samtidig med på om selve oversiktsområdet er i bildet, slik at den
 * faste mobilbaren vises hele tiden du står i oversikten — og bare der.
 */
function useActiveSection(
  items: HubNavItem[],
  rootRef: { current: HTMLDivElement | null },
  offset = 140
) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);
  const [progress, setProgress] = useState(0);
  const [inSection, setInSection] = useState(false);

  useEffect(() => {
    const update = () => {
      const root = rootRef.current;
      if (root) {
        const rect = root.getBoundingClientRect();
        // Baren kommer ned allerede når oversikten har nådd øvre halvdel av
        // skjermen — altså idet du er på vei inn i innholdet, ikke først når
        // du har scrollet forbi den første seksjonen — og blir liggende til
        // hele oversikten er passert. Så lenge du leser her, har du en meny
        // å trykke på.
        setInSection(
          rect.top <= window.innerHeight * 0.55 && rect.bottom > 160
        );
        const travelled = -rect.top;
        const span = rect.height - window.innerHeight;
        setProgress(
          span > 0 ? Math.min(100, Math.max(0, (travelled / span) * 100)) : 0
        );
      }
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
  }, [items, offset, rootRef]);

  return { activeId, progress, inSection };
}

/** Ikonet for en seksjon — `layers` når redaktøren ikke har valgt noe. */
const iconOf = (item?: HubNavItem): IconName => item?.icon ?? "layers";

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
                <span className="min-w-0 flex-1 leading-snug">
                  {item.label}
                </span>
                {item.meta && (
                  <span className="shrink-0 text-[0.7rem] text-muted-foreground tabular-nums">
                    {item.meta}
                  </span>
                )}
              </UILink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Fast topplinje med brikker (mobil). Ligger `fixed` rett under sidens header,
 * ikke i innholdsflyten — så den dukker ikke opp som en rar stripe midt på
 * siden, den kommer ned som en del av toppen idet oversikten begynner.
 *
 * Brikkene er vannrett scrollbare og viser alle seksjonene samtidig. Det er
 * ett trykk til hvor som helst, mot to med et nedtrekk.
 */
function HubBar({
  items,
  title,
  activeId,
  progress,
  visible,
}: {
  items: HubNavItem[];
  title: string;
  activeId?: string;
  progress: number;
  visible: boolean;
}) {
  const scrollerRef = useRef<HTMLUListElement | null>(null);
  const chipRefs = useRef(new Map<string, HTMLLIElement>());

  const registerChip = useCallback(
    (id: string) => (node: HTMLLIElement | null) => {
      if (node) {
        chipRefs.current.set(id, node);
      } else {
        chipRefs.current.delete(id);
      }
    },
    []
  );

  // Hold den aktive brikka synlig. Vi flytter `scrollLeft` selv i stedet for
  // `scrollIntoView`, som også ville dratt i sidens loddrette scroll.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const chip = activeId ? chipRefs.current.get(activeId) : undefined;
    if (!(scroller && chip)) return;
    const target =
      chip.offsetLeft - (scroller.clientWidth - chip.clientWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeId]);

  return (
    <div
      // Fester seg rett under sidens header når den finnes: `SiteHeader`
      // publiserer sin høyde som `--site-header-offset` (4rem synlig, 0 når
      // den har skjult seg ved scroll nedover). Baren følger med i samme
      // tempo/kurve som headeren, så de beveger seg som én enhet. Uten
      // header (Storybook, andre flater) er offset 0 = som før.
      className={cn(
        "fixed inset-x-0 z-40 transition-[top,transform,opacity] duration-300 ease-drawer motion-reduce:transition-none lg:hidden",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-4 pointer-events-none opacity-0"
      )}
      style={{ top: "var(--site-header-offset, 0px)" }}
      aria-hidden={!visible}
    >
      <div className="border-primary/15 border-b bg-background/95 shadow-[0_12px_32px_-20px_rgba(0,64,41,0.45)] backdrop-blur-xl">
        <nav aria-label={title}>
          <ul
            ref={scrollerRef}
            className="flex gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id} ref={registerChip(item.id)}>
                  <UILink
                    href={`#${item.id}`}
                    aria-current={active ? "location" : undefined}
                    tabIndex={visible ? undefined : -1}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-heading font-semibold text-[0.8rem] transition-colors duration-200",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/12 bg-foreground/[0.03] text-muted-foreground"
                    )}
                  >
                    <Icon name={iconOf(item)} className="size-3.5 shrink-0" />
                    {item.label}
                  </UILink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="h-0.5 bg-primary/10">
          <div
            className="h-full rounded-r-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Oversiktsside med sidemeny: innholdet i én kolonne, en sticky meny til
 * venstre på desktop, og en fast brikkelinje under headeren på mobil. Menyene
 * peker på #ankre i innholdet — så alt som trengs er at hver seksjon har en
 * `id`.
 *
 * Innholdet starter med en gang: menyen ER kartet, så siden trenger ikke en
 * ekstra liste over seg selv før man får se noe.
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { activeId, progress, inSection } = useActiveSection(nav, rootRef);
  const hasNav = nav.length > 0;

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      {hasNav && (
        <HubBar
          items={nav}
          title={navTitle}
          activeId={activeId}
          progress={progress}
          visible={inSection}
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
              {/* Menyen fester seg rett under headeren — samme
                  `--site-header-offset` som mobil-baren bruker, så den følger
                  headeren når den skjuler og viser seg i stedet for å henge
                  et stykke nede på siden. Den er også høy-begrenset og
                  scrollbar for seg selv, slik at alle punktene er innen
                  rekkevidde uansett hvor lang menyen blir. */}
              <div
                className="sticky flex max-h-[calc(100svh-var(--site-header-offset,0px)-3rem)] flex-col gap-8 overflow-y-auto py-10 transition-[top] duration-300 ease-drawer [scrollbar-width:thin] motion-reduce:transition-none"
                style={{
                  top: "calc(var(--site-header-offset, 0px) + 1.25rem)",
                }}
              >
                <HubRail items={nav} title={navTitle} activeId={activeId} />
                {aside}
              </div>
            </aside>
          )}
          <div className="min-w-0 pt-2">{children}</div>
        </div>
      </Container>
    </div>
  );
}
