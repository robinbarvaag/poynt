import type { MediaResource } from "./payload-image";

/**
 * Liten bildekreditering for stock-bilder (Pexels/Giphy). Leser `creditLine` +
 * `sourceUrl` som settes ved import (se admin/actions/stock-media.ts) og
 * returnerer `null` for vanlige opplastede bilder — så den kan trygt strøs på
 * alle bilde-kall uten å lage tomme element.
 *
 * Pexels og Giphy ønsker synlig kreditering der bildet vises; «overlay» legger
 * et diskret badge i hjørnet (krever en `position: relative`-forelder, som
 * `fill`-bilder allerede har), «caption» rendrer en linje under bildet.
 */

type MediaCreditInput =
  | Pick<MediaResource, "creditLine" | "sourceUrl">
  | number
  | null
  | undefined;

export type MediaCreditProps = {
  media: MediaCreditInput;
  variant?: "overlay" | "caption";
};

export function MediaCredit({ media, variant = "overlay" }: MediaCreditProps) {
  const resource = media && typeof media === "object" ? media : null;
  const credit = resource?.creditLine?.trim();
  if (!credit) {
    return null;
  }

  const href = resource?.sourceUrl?.trim();
  const label = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="underline-offset-2 hover:underline"
    >
      {credit}
    </a>
  ) : (
    credit
  );

  if (variant === "caption") {
    return (
      <figcaption className="mt-1 text-muted-foreground text-xs">
        {label}
      </figcaption>
    );
  }

  return (
    <span className="pointer-events-none absolute right-1.5 bottom-1.5 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/90 leading-tight [&_a]:pointer-events-auto">
      {label}
    </span>
  );
}
