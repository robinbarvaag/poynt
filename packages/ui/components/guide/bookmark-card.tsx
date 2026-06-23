import type * as React from "react";
import { cn } from "../../lib/utils";

export interface BookmarkCardProps {
  /** Uten URL blir kortet ikke-klikkbart (kun en referanse). */
  url?: string;
  title?: string;
  description?: string;
  /** Forhåndsvisningsbilde (typisk et <Image>). */
  image?: React.ReactNode;
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
        "group/bm flex items-stretch justify-between gap-4 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-300",
        url && "hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1 p-4">
        <span className="line-clamp-1 font-heading font-semibold text-foreground">
          {title || host || "Lenke"}
        </span>
        {description && (
          <span className="line-clamp-2 text-muted-foreground text-sm">
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
        <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden bg-muted/40 sm:w-40 *:[img]:h-full *:[img]:w-full *:[img]:object-cover">
          {image}
        </div>
      )}
    </Tag>
  );
}
