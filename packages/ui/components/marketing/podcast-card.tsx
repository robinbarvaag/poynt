import type * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../card";

export interface PodcastCardProps {
  /** Lenke til episodesiden (eller en ekstern lytte-lenke). */
  href: string;
  title: string;
  description?: string;
  episodeNumber?: number;
  /** Varighet som tekst, f.eks. "45 min". */
  duration?: string;
  /** Ferdig formatert dato, f.eks. "3. jun 2026". */
  date?: string;
  /** Kvadratisk cover-slot, f.eks. et `next/image` med `fill className="object-cover"`. */
  cover?: React.ReactNode;
  /** Liten markør på coveret, f.eks. "Siste episode". */
  badge?: string;
  /** Stort, fremhevet kort for siste episode (spenner 2 kolonner). */
  featured?: boolean;
  className?: string;
}

function PlayButton({ featured }: { featured?: boolean }) {
  return (
    <span
      className={cn(
        "absolute bottom-3 left-3 z-20 grid place-content-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover/podcast:scale-110",
        featured ? "size-14" : "size-12"
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={featured ? "ml-0.5 size-6" : "ml-0.5 size-5"}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

function Meta({
  episodeNumber,
  duration,
  date,
}: Pick<PodcastCardProps, "episodeNumber" | "duration" | "date">) {
  const parts = [
    episodeNumber != null ? `Ep. ${episodeNumber}` : null,
    duration ?? null,
    date ?? null,
  ].filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return (
    <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.16em]">
      {parts.join(" · ")}
    </span>
  );
}

function Cover({
  cover,
  badge,
  featured,
}: Pick<PodcastCardProps, "cover" | "badge" | "featured">) {
  return (
    <div className={cn("p-3", featured && "md:h-full")}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-muted",
          featured
            ? "aspect-square md:aspect-auto md:h-full md:min-h-72"
            : "aspect-square"
        )}
      >
        {cover ?? (
          <div className="flex size-full items-center justify-center bg-foreground/5">
            <span
              aria-hidden="true"
              className="size-14 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-foreground/10"
            />
          </div>
        )}
        {badge && (
          <span className="absolute top-3 right-3 z-20 rounded-full bg-background/90 px-3 py-1 font-semibold text-foreground text-xs shadow-sm">
            {badge}
          </span>
        )}
        <PlayButton featured={featured} />
      </div>
    </div>
  );
}

/**
 * Episodekort for podkast. Cover-art-et er helten (det fargede elementet), med en
 * tydelig play-knapp som signatur — så det leser umiddelbart som «lytt», ikke
 * butikk/blogg. Holdes på en rolig (default) flate slik at cover-fargene får råde.
 * Presentasjons-only.
 */
export function PodcastCard({
  href,
  title,
  description,
  episodeNumber,
  duration,
  date,
  cover,
  badge,
  featured = false,
  className,
}: PodcastCardProps) {
  const content = (
    <div
      className={cn(
        "flex h-full flex-col gap-2 px-5 pt-2 pb-5",
        featured && "md:justify-center md:px-8 md:py-10"
      )}
    >
      <Meta episodeNumber={episodeNumber} duration={duration} date={date} />

      <h3
        className={cn(
          "font-bold font-heading text-foreground leading-snug tracking-tight transition-colors group-hover/podcast:text-primary",
          featured ? "text-2xl md:text-3xl" : "line-clamp-2 text-lg"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "text-muted-foreground text-sm leading-relaxed",
            featured ? "line-clamp-3 md:text-base" : "line-clamp-2"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );

  return (
    <Card
      asChild
      className={cn(
        "group/podcast gap-0 overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1.5",
        featured && "sm:col-span-2",
        className
      )}
    >
      <a href={href}>
        <div
          className={cn(
            featured && "md:grid md:h-full md:grid-cols-2 md:items-stretch"
          )}
        >
          <Cover cover={cover} badge={badge} featured={featured} />
          {content}
        </div>
      </a>
    </Card>
  );
}
