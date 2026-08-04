import type { PodcastEpisode } from "@/lib/podcast-rss";
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
    // RSS-cover kommer fra ukjente domener → vanlig <img> (ikke next/image).
    cover: episode.coverUrl ? (
      <img
        src={episode.coverUrl}
        alt={episode.title}
        className={options?.coverClassName ?? "size-full object-cover"}
      />
    ) : undefined,
  };
}
