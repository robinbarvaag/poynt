import type * as React from "react";
import { cn } from "../../lib/utils";

export interface BookmarkCardProps {
  /** Uten URL blir kortet ikke-klikkbart (kun en referanse). */
  url?: string;
  title?: string;
  description?: string;
  /** Forhåndsvisningsbilde (typisk et <Image>). */
  image?: React.ReactNode;
  /**
   * Stor variant – fyller bredden og viser et større forhåndsvisningsbilde, så
   * et enkelt bokmerke ser ut som en ordentlig lenke-/OG-presentasjon.
   */
  featured?: boolean;
  className?: string;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Lenke-/bokmerke-kort i Notion-stil: tittel + beskrivelse til venstre, valgfritt
 * forhåndsvisningsbilde til høyre, favicon + domene i bunn. Lite løft på hover.
 * Uten URL rendres et ikke-klikkbart referansekort.
 */
export function BookmarkCard({
  url,
  title,
  description,
  image,
  featured,
  className,
}: BookmarkCardProps) {
  const host = url ? hostOf(url) : null;
  const Tag = url ? "a" : "div";
  return (
    <Tag
      {...(url
        ? { href: url, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(
        "group/bm flex items-stretch justify-between overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-300",
        featured ? "gap-6 sm:min-h-[180px]" : "gap-4",
        url && "hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col",
          featured ? "gap-1.5 p-5 sm:p-7" : "gap-1 p-4"
        )}
      >
        <span
          className={cn(
            "font-heading font-semibold text-foreground",
            featured ? "line-clamp-2 text-lg sm:text-xl" : "line-clamp-1"
          )}
        >
          {title || host || "Lenke"}
        </span>
        {description && (
          <span
            className={cn(
              "text-muted-foreground text-sm",
              featured ? "line-clamp-3 sm:text-base" : "line-clamp-2"
            )}
          >
            {description}
          </span>
        )}
        {host && (
          <span className="mt-auto flex items-center gap-1.5 pt-2 text-muted-foreground text-xs">
            <img
              src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
              alt=""
              width={14}
              height={14}
              className="size-3.5 rounded-sm"
              aria-hidden="true"
            />
            <span className="truncate">{host}</span>
          </span>
        )}
      </div>
      {image && (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-muted/40 *:[img]:h-full *:[img]:w-full *:[img]:object-cover",
            featured ? "w-36 sm:w-56 lg:w-72" : "aspect-[4/3] w-28 sm:w-40"
          )}
        >
          {image}
        </div>
      )}
    </Tag>
  );
}
