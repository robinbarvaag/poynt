import type * as React from "react";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Card } from "../card";

export type ContentFormat = "guide" | "artikkel" | "kurs" | "podkast";

interface FormatConfig {
  label: string;
  icon: IconName;
  /** Gradient-fallback når innholdet mangler cover-bilde. */
  fallback: string;
}

export const CONTENT_FORMATS: Record<ContentFormat, FormatConfig> = {
  guide: {
    label: "Guide",
    icon: "compass",
    fallback: "bg-gradient-to-br from-mint/70 via-mint/30 to-background",
  },
  artikkel: {
    label: "Artikkel",
    icon: "newspaper",
    fallback: "bg-gradient-to-br from-saffron/60 via-saffron/25 to-background",
  },
  kurs: {
    label: "Kurs",
    icon: "graduation-cap",
    fallback: "bg-gradient-to-br from-salmon/60 via-salmon/25 to-background",
  },
  podkast: {
    label: "Podkast",
    icon: "mic",
    fallback: "bg-gradient-to-br from-primary/35 via-primary/15 to-background",
  },
};

export interface ContentMetaItem {
  icon?: IconName;
  label: string;
}

export type ContentCardSurface =
  | "default"
  | "saffron"
  | "salmon"
  | "mint"
  | "primary"
  | "ink";

export interface ContentCardProps {
  href: string;
  format: ContentFormat;
  title: string;
  lede?: string;
  /** Kategori/kanal-ledetekst, vises ved siden av formatet. */
  category?: string;
  /** Cover-bilde (typisk et <Image>). Faller tilbake til merkevare-gradient. */
  cover?: React.ReactNode;
  /** Liten meta-rad nederst, f.eks. lesetid / antall leksjoner. */
  meta?: ContentMetaItem[];
  surface?: ContentCardSurface;
  className?: string;
}

/**
 * Ett kort for alt det «myke» innholdet — guide, artikkel, kurs eller podkast.
 * Formatet styrer ledetekst, ikon og gradient-fallback, så kortene er
 * gjenkjennelige på tvers, men ett gjenbrukbart element. Mangler cover-bilde,
 * tegnes en merkevare-gradient med format-ikon i stedet for en tom boks.
 */
export function ContentCard({
  href,
  format,
  title,
  lede,
  category,
  cover,
  meta,
  surface = "default",
  className,
}: ContentCardProps) {
  const config = CONTENT_FORMATS[format];

  return (
    <Card
      asChild
      surface={surface}
      className={cn(
        // transform-gpu + will-change holder kortet på et stabilt GPU-lag under
        // hover-transformen. Uten dette dropper Chrome det avrundede klippet
        // (overflow-hidden + rounded-3xl) midt i transisjonen, så hjørnene
        // «popper» firkantet og runde igjen ved hover inn/ut.
        "group/content h-full transform-gpu gap-0 overflow-hidden p-0 transition-transform duration-300 will-change-transform hover:-translate-y-1.5",
        className
      )}
    >
      <a href={href}>
        <div className="relative aspect-[2/1] shrink-0 overflow-hidden rounded-t-3xl">
          {cover ? (
            <div className="absolute inset-0 transform-gpu *:[img]:h-full *:[img]:w-full *:[img]:object-cover *:[img]:transition-transform *:[img]:duration-500 group-hover/content:*:[img]:scale-105">
              {cover}
            </div>
          ) : (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                config.fallback
              )}
            >
              <Icon
                name={config.icon}
                className="size-14 text-foreground/15"
                strokeWidth={1.5}
              />
            </div>
          )}
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 font-heading font-semibold text-foreground text-xs ring-1 ring-foreground/10 backdrop-blur">
            <Icon name={config.icon} className="size-3.5 text-primary" />
            {config.label}
          </span>
        </div>

        <div className="flex h-full flex-col gap-3 px-5 pt-4 pb-5">
          {category && (
            <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
              {category}
            </span>
          )}

          <h3 className="font-bold font-heading text-lg leading-snug tracking-tight">
            {title}
          </h3>

          {lede && (
            <p className="line-clamp-2 text-current/70 text-sm leading-relaxed">
              {lede}
            </p>
          )}

          {/* Bunnrad forankret med mt-auto: absorberer høydeforskjellen i et
              likt-høyde-rutenett, så strekket leses som en bevisst footer i
              stedet for dødplass. Meta til venstre, «Les mer» alltid til høyre. */}
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-current/60 text-xs">
            {meta?.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1">
                {item.icon && <Icon name={item.icon} className="size-3.5" />}
                {item.label}
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 font-heading font-semibold text-primary text-sm">
              Les mer
              <Icon
                name="arrow-right"
                className="size-4 transition-transform duration-300 group-hover/content:translate-x-1"
              />
            </span>
          </div>
        </div>
      </a>
    </Card>
  );
}
