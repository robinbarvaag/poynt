import type { PodcastEpisode } from "@/lib/podcast-rss";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Delt mapping fra RSS-episode til kortdata — brukes av både /podkast-siden
 * (PodcastExplorer) og «Fra podkasten»-blokken, så dato-format og cover-regler
 * ikke driver fra hverandre.
 */

export interface PodcastEpisodeCard {
  id: string;
  href: string;
  title: string;
  description?: string;
  episodeNumber?: number;
  duration?: string;
  date?: string;
  cover?: ReactNode;
}

export function formatEpisodeDate(value: string, withYear = true): string {
  return new Date(value).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
  });
}

export function toPodcastEpisodeCard(
  episode: PodcastEpisode,
  options?: { withYear?: boolean; coverClassName?: string }
): PodcastEpisodeCard {
  return {
    id: episode.id,
    href: episode.link ?? "#",
    title: episode.title,
    description: episode.description,
    episodeNumber: episode.episodeNumber,
    duration: episode.durationLabel,
    date: episode.publishedAt
      ? formatEpisodeDate(episode.publishedAt, options?.withYear ?? true)
      : undefined,
    cover: episode.coverUrl ? (
      <EpisodeCoverImage
        src={episode.coverUrl}
        alt={episode.title}
        className={options?.coverClassName ?? "size-full object-cover"}
      />
    ) : undefined,
  };
}

/**
 * Vertene podkast-coverne faktisk kommer fra (Spotify for Creators / Anchor).
 * Må speile `images.remotePatterns` i next.config.mjs — ellers avviser
 * bildeoptimaliseringen dem.
 */
const OPTIMIZED_COVER_HOSTS = new Set(["d3t3ozftmdmh3i.cloudfront.net"]);

/** Coverne vises i kvadratiske kort: 1 kolonne i Cover Flow, 2–3 i rutenettet. */
const COVER_SIZES = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 75vw";

function isOptimizedCoverHost(src: string): boolean {
  try {
    return OPTIMIZED_COVER_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

/**
 * Coverne i RSS-feeden er originaler på 3000×3000 px og 1–1,5 MB. Rått og uten
 * `loading="lazy"` lager React dessuten en preload-lenke for dem, som også
 * følger med når andre sider forhåndshenter forsiden — da konkurrerer de med
 * toppbildet (LCP) på hele nettstedet. Derfor: gjennom bildeoptimaliseringen
 * og alltid lazy. Cover fra en ukjent vert vises rått, men fortsatt lazy.
 */
function EpisodeCoverImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  if (!isOptimizedCoverHost(src)) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={600}
      sizes={COVER_SIZES}
      className={className}
    />
  );
}
