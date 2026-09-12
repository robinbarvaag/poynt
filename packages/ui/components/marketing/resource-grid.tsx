"use client";

import type * as React from "react";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import { Card } from "../card";
import { gridVariants } from "../container";
import { Stagger, StaggerItem } from "../motion";
import { SectionHeader } from "../section-header";

/**
 * Hva slags ressurs kortet peker på. Styrer ikon, etikett og hvordan bildet
 * beskjæres (bokomslag er stående, podkast-cover er kvadratisk, nettsider
 * er liggende).
 */
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
  /** Bildeform i rutenettet. `none` = bare ikon (filer har sjelden bilde). */
  image: "wide" | "square" | "portrait" | "none";
  /** Handlingsordet nederst til høyre. */
  action: string;
}

export const RESOURCE_KINDS: Record<ResourceKind, KindConfig> = {
  link: { label: "Lenke", icon: "link", image: "wide", action: "Åpne" },
  file: { label: "Fil", icon: "file-text", image: "none", action: "Last ned" },
  book: { label: "Bok", icon: "book", image: "portrait", action: "Se boka" },
  podcast: { label: "Podkast", icon: "mic", image: "square", action: "Lytt" },
  music: { label: "Musikk", icon: "music", image: "square", action: "Lytt" },
  video: { label: "Video", icon: "play", image: "wide", action: "Se" },
  tool: { label: "Verktøy", icon: "wrench", image: "wide", action: "Prøv" },
  app: { label: "App", icon: "smartphone", image: "square", action: "Åpne" },
};

export interface ResourceItem {
  title: string;
  description?: string;
  kind: ResourceKind;
  /** Lenke eller fil-URL. Uten href er kortet en ren referanse. */
  href?: string;
  /** Sant når href er en fil som skal lastes ned (ikke åpnes i ny fane). */
  download?: boolean;
  /** Bilde/omslag (typisk et <Image>). */
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

export interface ResourceGridProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  items: ResourceItem[];
  /** `grid` = kort med bilde, `list` = kompakte rader. Default `grid`. */
  layout?: "grid" | "list";
  /** Kolonner på desktop i grid-layout. Default 3. */
  columns?: 2 | 3 | 4;
  /**
   * Viser filter-brikker bygd av kategoriene på kortene. Default: på når
   * minst to ulike kategorier finnes.
   */
  filter?: boolean;
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

const IMAGE_CLASS: Record<KindConfig["image"], string> = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[2/3]",
  none: "",
};

/** Kompakt bilde-/ikon-rute brukt av begge layoutene. */
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
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-1/40 text-primary",
          "size-14 *:[img]:h-full *:[img]:w-full *:[img]:object-cover"
        )}
      >
        {item.image ?? <Icon name={config.icon} className="size-6" />}
      </span>
    );
  }

  if (config.image === "none" || !item.image) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-t-3xl bg-gradient-to-br from-accent-1/60 via-accent-1/25 to-background">
        <Icon
          name={config.icon}
          className="size-12 text-foreground/20"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (config.image === "portrait") {
    // Bokomslag: stående bilde med skygge på en rolig flate, ikke strukket
    // til kortets bredde.
    return (
      <div className="flex aspect-[16/9] items-end justify-center overflow-hidden rounded-t-3xl bg-gradient-to-br from-accent-3/60 via-accent-3/25 to-background px-6 pt-6">
        <div className="w-[38%] overflow-hidden rounded-t-md shadow-xl ring-1 ring-foreground/10 transition-transform duration-500 group-hover/resource:-translate-y-1 *:[img]:h-auto *:[img]:w-full">
          {item.image}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-t-3xl bg-muted/40 *:[img]:absolute *:[img]:inset-0 *:[img]:h-full *:[img]:w-full *:[img]:object-cover *:[img]:transition-transform *:[img]:duration-500 group-hover/resource:*:[img]:scale-105",
        config.image === "square" ? "aspect-[16/10]" : IMAGE_CLASS.wide
      )}
    >
      {item.image}
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
 * Typen styrer ikon og bildeform, så bøker ser ut som bøker og podkaster som
 * podkaster, men det er ÉTT kort med én hover og én bunnrad.
 */
export function ResourceCard({
  item,
  layout = "grid",
  linkComponent,
  className,
}: {
  item: ResourceItem;
  layout?: "grid" | "list";
  linkComponent?: React.ComponentType<ResourceLinkProps>;
  className?: string;
}) {
  const config = RESOURCE_KINDS[item.kind];
  const host = hostOf(item.href);
  const external = Boolean(host) && !item.download;
  const Link = linkComponent ?? UILink;

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

  const action = (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 font-heading font-semibold text-primary text-sm">
      {config.action}
      <Icon
        name={item.download ? "download" : "arrow-right"}
        className={cn(
          "size-4 transition-transform duration-300",
          item.download
            ? "group-hover/resource:translate-y-0.5"
            : "group-hover/resource:translate-x-1"
        )}
      />
    </span>
  );

  if (layout === "list") {
    const row = (
      <>
        <Thumb item={item} size="row" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="line-clamp-1 font-heading font-semibold text-foreground">
              {item.title}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
              {config.label}
            </span>
          </span>
          {item.description && (
            <span className="line-clamp-2 text-muted-foreground text-sm">
              {item.description}
            </span>
          )}
          {(item.note || host) && (
            <span className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
              {[item.note, host].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
        {linkProps && action}
      </>
    );
    const rowClass = cn(
      "group/resource flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-300",
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
          {(item.note || host) && (
            <span className="line-clamp-1">
              {[item.note, host].filter(Boolean).join(" · ")}
            </span>
          )}
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
 */
export function ResourceGrid({
  eyebrow,
  title,
  intro,
  items,
  layout = "grid",
  columns = 3,
  filter,
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

  if (items.length === 0) return null;

  return (
    <div className={className}>
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

      {/* Nøkkelen på Stagger gjør at et filterbytte animerer inn på nytt. */}
      <Stagger
        key={active ?? "__all"}
        className={
          layout === "grid"
            ? cn(gridVariants({ cols: columns, gap: "md" }))
            : "flex flex-col gap-3"
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
  );
}
