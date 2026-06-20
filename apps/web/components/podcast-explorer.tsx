"use client";

import { Input, PodcastGrid, type PodcastGridItem } from "@poynt/ui";
import { useMemo, useState } from "react";

export interface PodcastExplorerEpisode extends PodcastGridItem {
  /** Forhåndsbygd, lowercased søketekst (tittel + beskrivelse). */
  search: string;
}

interface PodcastExplorerProps {
  episodes: PodcastExplorerEpisode[];
  emptyStateText: string;
}

export function PodcastExplorer({
  episodes,
  emptyStateText,
}: PodcastExplorerProps) {
  const [query, setQuery] = useState("");

  const visible = useMemo<PodcastGridItem[]>(() => {
    const q = query.trim().toLowerCase();
    return episodes
      .filter((episode) => q === "" || episode.search.includes(q))
      .map(({ search: _search, ...rest }) => rest);
  }, [episodes, query]);

  return (
    <div className="space-y-8">
      <div className="relative w-full max-w-sm">
        <span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 text-muted-foreground">
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Søk i episoder …"
          className="rounded-full pl-10"
          aria-label="Søk i episoder"
        />
      </div>

      {visible.length > 0 ? (
        <PodcastGrid episodes={visible} featureFirst={query.trim() === ""} />
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {emptyStateText}
        </p>
      )}
    </div>
  );
}
