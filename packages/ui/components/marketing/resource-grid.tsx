"use client";

import type * as React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import { Card } from "../card";
import { ExpandableText } from "../expandable-text";
import { Stagger, StaggerItem } from "../motion";
import { SectionHeader } from "../section-header";

/** Hva slags ressurs kortet peker på. Styrer ikon, etikett og handlingsord. */
export type ResourceKind =
  | "link"
  | "file"
  | "book"
  | "podcast"
  | "music"
  | "video"
  | "tool"
  | "app";

interface KindConfig {
  label: string;
  icon: IconName;
  /** Handlingsordet nederst til høyre. */
  action: string;
}

export const RESOURCE_KINDS: Record<ResourceKind, KindConfig> = {
  link: { label: "Lenke", icon: "link", action: "Åpne" },
  file: { label: "Fil", icon: "file-text", action: "Last ned" },
  book: { label: "Bok", icon: "book", action: "Se boka" },
  podcast: { label: "Podkast", icon: "mic", action: "Lytt" },
  music: { label: "Musikk", icon: "music", action: "Lytt" },
  video: { label: "Video", icon: "play", action: "Se" },
  tool: { label: "Verktøy", icon: "wrench", action: "Prøv" },
  app: { label: "App", icon: "smartphone", action: "Åpne" },
};

export interface ResourceItem {
  title: string;
  description?: string;
  kind: ResourceKind;
  /** Lenke eller fil-URL. Uten href er kortet en ren referanse. */
  href?: string;
  /** Sant når href er en fil som skal lastes ned (ikke åpnes i ny fane). */
  download?: boolean;
  /** Bilde/omslag (typisk et <Image>). Fyller alltid bildeflaten. */
  image?: React.ReactNode;
  /** Fri kategori — brukes til filter-brikkene («Podkast», «Fokus», …). */
  category?: string;
  /** Liten tilleggstekst: forfatter, «anbefalt av …», varighet. */
  note?: string;
}

export interface ResourceLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
  download?: boolean;
}

/**
 * - `grid`: kort med stort bilde og beskrivelse
 * - `compact`: små kort i rutenett (bilde, tittel, kilde) — for lange lister
 * - `list`: rader med beskrivelse, én kolonne
 */
export type ResourceLayout = "grid" | "compact" | "list";

export interface ResourceGridProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  items: ResourceItem[];
  /** Default `grid`. */
  layout?: ResourceLayout;
  /**
   * Høyeste antall kolonner (grid/compact). Blir færre når blokken har lite
   * plass. Default 3.
   */
  columns?: 2 | 3 | 4;
  /**
   * Viser filter-brikker bygd av kategoriene på kortene. Default: på når
   * minst to ulike kategorier finnes.
   */
  filter?: boolean;
  /**
   * Fold sammen lange lister bak en fade og «Vis alle»-knapp. Default på.
   */
  collapse?: boolean;
  /** Etikett på «vis alle»-brikka. */
  allLabel?: string;
  /** Lenkekomponent (typisk next/link). Default: vanlig <a>. */
  linkComponent?: React.ComponentType<ResourceLinkProps>;
  className?: string;
}

function hostOf(url?: string): string | null {
  if (!url || !/^https?:/i.test(url)) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Kolonner styres av blokkens egen bredde (container query), ikke skjermen —
 * blokken står både i full bredde og ved siden av en sidemeny. Hver kolonne
 * får minst ~15rem; ellers faller den tilbake til færre kolonner.
 */
const GRID_COLS: Record<NonNullable<ResourceGridProps["columns"]>, string> = {
  2: "@lg:grid-cols-2",
  3: "@lg:grid-cols-2 @3xl:grid-cols-3",
  4: "@lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4",
};

/**
 * Høyde (rem) lista foldes sammen til. Den foldes bare når innholdet er
 * vesentlig høyere (COLLAPSE_SLACK), så vi aldri skjuler en halv rad bak en
 * knapp.
 */
const COLLAPSED_REM: Record<ResourceLayout, number> = {
  grid: 48,
  compact: 30,
  list: 32,
};
const COLLAPSE_SLACK = 1.3;

/** Bildet fyller flaten og beskjæres — feil format byttes i admin. */
const COVER_IMG =
  "*:[img]:absolute *:[img]:inset-0 *:[img]:h-full *:[img]:w-full *:[img]:object-cover";

function Thumb({
  item,
  size,
}: {
  item: ResourceItem;
  size: "row" | "card";
}) {
  const config = RESOURCE_KINDS[item.kind];

  if (size === "row") {
    return (
      <span
        className={cn(
          "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-1/40 text-primary",
          COVER_IMG
        )}
      >
        {item.image ?? <Icon name={config.icon} className="size-6" />}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-t-3xl",
        item.image
          ? cn(
              "bg-muted/40 *:[img]:transition-transform *:[img]:duration-500 group-hover/resource:*:[img]:scale-105",
              COVER_IMG
            )
          : "bg-gradient-to-br from-accent-1/60 via-accent-1/25 to-background"
      )}
    >
      {item.image ?? (
        <Icon
          name={config.icon}
          className="size-12 text-foreground/20"
          strokeWidth={1.5}
        />
      )}
    </div>
  );
}

function KindBadge({ kind }: { kind: ResourceKind }) {
  const config = RESOURCE_KINDS[kind];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 font-heading font-semibold text-foreground text-xs ring-1 ring-foreground/10 backdrop-blur">
      <Icon name={config.icon} className="size-3.5 text-primary" />
      {config.label}
    </span>
  );
}

/**
 * Ett kort per ressurs — lenke, fil, bok, podkast, musikk, video, verktøy.
 * Typen styrer ikon og etikett, men det er ÉTT kort med én hover og én
 * bunnrad, i tre tettheter (se `ResourceLayout`).
 */
export function ResourceCard({
  item,
  layout = "grid",
  linkComponent,
  className,
}: {
  item: ResourceItem;
  layout?: ResourceLayout;
  linkComponent?: React.ComponentType<ResourceLinkProps>;
  className?: string;
}) {
  const config = RESOURCE_KINDS[item.kind];
  const host = hostOf(item.href);
  const external = Boolean(host) && !item.download;
  const Link = linkComponent ?? UILink;
  const meta = [item.note, host].filter(Boolean).join(" · ");

  const linkProps = item.href
    ? {
        href: item.href,
        ...(item.download
          ? { download: true }
          : external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {}),
      }
    : null;

  const actionIcon = (
    <Icon
      name={item.download ? "download" : "arrow-right"}
      className={cn(
        "size-4 transition-transform duration-300",
        item.download
          ? "group-hover/resource:translate-y-0.5"
          : "group-hover/resource:translate-x-1"
      )}
    />
  );

  const action = (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 font-heading font-semibold text-primary text-sm">
      {config.action}
      {actionIcon}
    </span>
  );

  const kindPill =
    "rounded-full bg-muted px-2 py-0.5 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide";

  if (layout === "compact") {
    const row = (
      <>
        <Thumb item={item} size="row" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-1 font-heading font-semibold text-[0.65rem] text-muted-foreground uppercase tracking-[0.14em]">
            {item.category ?? config.label}
          </span>
          <span className="line-clamp-2 font-heading font-semibold text-foreground text-sm leading-snug">
            {item.title}
          </span>
          {meta && (
            <span className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
              {meta}
            </span>
          )}
        </span>
        {linkProps && (
          <span className="shrink-0 self-center text-primary">
            {actionIcon}
          </span>
        )}
      </>
    );
    const rowClass = cn(
      "group/resource flex h-full items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-300",
      linkProps &&
        "pressable motion-safe:hover:-translate-y-0.5 hover:shadow-md",
      className
    );
    return linkProps ? (
      <Link {...linkProps} className={rowClass}>
        {row}
      </Link>
    ) : (
      <div className={rowClass}>{row}</div>
    );
  }

  if (layout === "list") {
    const rowClass = cn(
      // Kortet er en div, ikke én stor lenke: tittelen bærer lenka og strekker
      // seg over hele kortet (`after:inset-0`). Da kan «Vis mer» ligge inni
      // kortet — en knapp inni en <a> er hverken gyldig eller klikkbar.
      // Miniatyren toppstilles mot tittelen; sentrert flyter den i lufta når
      // teksten går over flere linjer.
      "group/resource relative flex flex-wrap items-start gap-x-4 gap-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-300",
      linkProps &&
        "pressable motion-safe:hover:-translate-y-0.5 hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-primary",
      className
    );
    return (
      <div className={rowClass}>
        <Thumb item={item} size="row" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* Smal blokk: tittelen får to linjer i stedet for å bli kuttet
                etter noen få ord. Klippingen må ligge INNI lenka — line-clamp
                er overflow:hidden, og klipper ellers bort det strukne
                overlegget så resten av kortet ikke er klikkbart. */}
            <p className="min-w-0 font-heading font-semibold text-foreground">
              {linkProps ? (
                <Link
                  {...linkProps}
                  className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl"
                >
                  <span className="line-clamp-2 @lg:line-clamp-1">
                    {item.title}
                  </span>
                </Link>
              ) : (
                <span className="line-clamp-2 @lg:line-clamp-1">
                  {item.title}
                </span>
              )}
            </p>
            {/* Når raden har en handling, flytter etiketten ned til
                handlingslinja på smale bredder. */}
            <span
              className={cn(kindPill, linkProps && "hidden @lg:inline-block")}
            >
              {config.label}
            </span>
          </div>
          {item.description && (
            <ExpandableText
              className="text-muted-foreground text-sm"
              // Over den strukne lenka, ellers treffer trykket kortet.
              buttonClassName="relative z-10"
            >
              {item.description}
            </ExpandableText>
          )}
          {meta && (
            <p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
              {meta}
            </p>
          )}
        </div>
        {linkProps && (
          // Smal blokk: egen linje under teksten — etikett til venstre,
          // handlingen til høyre. Bred blokk: samme rad, helt til høyre.
          <div className="flex w-full items-center gap-3 border-foreground/10 border-t pt-3 @lg:ml-auto @lg:w-auto @lg:self-center @lg:border-t-0 @lg:pt-0">
            <span className={cn(kindPill, "@lg:hidden")}>{config.label}</span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 font-heading font-semibold text-primary text-sm">
              {config.action}
              {actionIcon}
            </span>
          </div>
        )}
      </div>
    );
  }

  const body = (
    <>
      <div className="relative">
        <Thumb item={item} size="card" />
        <span className="absolute top-3 left-3">
          <KindBadge kind={item.kind} />
        </span>
      </div>
      <div className="flex h-full flex-col gap-2.5 px-5 pt-4 pb-5">
        {item.category && (
          <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
            {item.category}
          </span>
        )}
        <h3 className="font-bold font-heading text-lg leading-snug tracking-tight">
          {item.title}
        </h3>
        {item.description && (
          <p className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-3 text-muted-foreground text-xs">
          {meta && <span className="line-clamp-1">{meta}</span>}
          {linkProps && action}
        </div>
      </div>
    </>
  );

  return (
    <Card
      asChild={Boolean(linkProps)}
      className={cn(
        "group/resource h-full gap-0 overflow-hidden p-0",
        linkProps && "pressable motion-safe:hover:-translate-y-1.5",
        className
      )}
    >
      {linkProps ? <Link {...linkProps}>{body}</Link> : body}
    </Card>
  );
}

/**
 * Rutenett (eller liste) av ressurser med valgfrie filter-brikker bygd av
 * kortenes kategorier. Filteret er rent klientside — lista er liten nok til
 * at det ikke trengs søk, og brikkene forteller samtidig hva som finnes.
 * Lange lister foldes sammen bak en fade med «Vis alle»-knapp.
 */
export function ResourceGrid({
  eyebrow,
  title,
  intro,
  items,
  layout = "grid",
  columns = 3,
  filter,
  collapse = true,
  allLabel = "Alle",
  linkComponent,
  className,
}: ResourceGridProps) {
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const item of items) {
      const cat = item.category?.trim();
      if (cat && !seen.includes(cat)) seen.push(cat);
    }
    return seen;
  }, [items]);

  const showFilter = filter ?? categories.length > 1;
  const [active, setActive] = useState<string | null>(null);
  const visible = active
    ? items.filter((item) => item.category?.trim() === active)
    : items;

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const regionId = useId();
  const [expanded, setExpanded] = useState(false);
  // Starter sammenfoldet (også på serveren) så lange lister ikke hopper
  // sammen etter hydrering; målingen under slår det av når innholdet er kort.
  const [tooTall, setTooTall] = useState(collapse);
  const collapsedRem = COLLAPSED_REM[layout];

  useEffect(() => {
    const el = contentRef.current;
    if (!collapse || !el) return;
    const measure = () => {
      const rootPx = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      setTooTall(el.scrollHeight > collapsedRem * rootPx * COLLAPSE_SLACK);
    };
    measure();
    // Innholds-diven endrer høyde både ved filterbytte og bredde-endring.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapse, collapsedRem]);

  if (items.length === 0) return null;

  const collapsed = collapse && tooTall && !expanded;

  const toggle = () => {
    setExpanded(!expanded);
    if (!expanded) return;
    // Lista krymper under leseren — hopp tilbake til toppen av blokken så
    // man ikke havner midt i neste seksjon.
    requestAnimationFrame(() => {
      const top = rootRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) rootRef.current?.scrollIntoView({ block: "start" });
    });
  };

  return (
    <div ref={rootRef} className={cn("@container", className)}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      {showFilter && categories.length > 0 && (
        <fieldset className="-mt-6 mb-8 flex flex-wrap gap-2">
          <legend className="sr-only">Filtrer etter kategori</legend>
          {[null, ...categories].map((cat) => {
            const isActive = cat === active;
            return (
              <button
                key={cat ?? "__all"}
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={isActive}
                className={cn(
                  "pressable rounded-full px-4 py-1.5 font-heading font-semibold text-sm ring-1 transition-colors duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-background text-muted-foreground ring-foreground/15 hover:text-foreground"
                )}
              >
                {cat ?? allLabel}
              </button>
            );
          })}
        </fieldset>
      )}

      <div
        id={regionId}
        // Tastaturbrukere som taber inn i den skjulte delen får hele lista.
        onFocusCapture={() => collapsed && setExpanded(true)}
        style={collapsed ? { maxHeight: `${collapsedRem}rem` } : undefined}
        className={cn(
          // Luft rundt så hover-løft og skygge ikke klippes av overflow.
          collapsed &&
            "-m-2 overflow-hidden p-2 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        )}
      >
        <div ref={contentRef}>
          {/* Nøkkelen på Stagger gjør at et filterbytte animerer inn på nytt. */}
          <Stagger
            key={active ?? "__all"}
            className={
              layout === "list"
                ? "flex flex-col gap-3"
                : cn(
                    "grid grid-cols-1",
                    layout === "compact" ? "gap-3" : "gap-6",
                    GRID_COLS[columns]
                  )
            }
          >
            {visible.map((item, i) => (
              <StaggerItem key={`${item.title}-${i}`} className="h-full">
                <ResourceCard
                  item={item}
                  layout={layout}
                  linkComponent={linkComponent}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>

      {collapse && tooTall && (
        <div
          className={cn(
            "flex justify-center",
            // Åpen liste: knappen flyter i bunnen av skjermen mens lista er
            // synlig (sticky innenfor blokken), og legger seg under lista
            // når man scroller forbi — «Vis færre» er aldri langt unna.
            collapsed
              ? "relative -mt-6"
              : "pointer-events-none sticky bottom-4 z-10 mt-8"
          )}
        >
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls={regionId}
            className={cn(
              "pressable pointer-events-auto inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 font-heading font-semibold text-foreground text-sm ring-1 ring-foreground/15 transition-[background-color,box-shadow] duration-200 hover:bg-muted",
              expanded ? "shadow-lg" : "shadow-sm"
            )}
          >
            {expanded ? "Vis færre" : `Vis alle ${visible.length}`}
            <Icon
              name="chevron-down"
              className={cn(
                "size-4 text-primary transition-transform duration-300",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      )}
    </div>
  );
}
