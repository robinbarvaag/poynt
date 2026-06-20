import { cn } from "../../lib/utils";
import { PodcastCard, type PodcastCardProps } from "./podcast-card";

export interface PodcastGridItem extends PodcastCardProps {
  id: string | number;
}

export interface PodcastGridProps {
  episodes: PodcastGridItem[];
  /** Gjør den første (nyeste) episoden fremhevet (2 kolonner). Default true. */
  featureFirst?: boolean;
  className?: string;
}

/**
 * Oversikt over podkast-episoder. Rolige, cover-art-ledede kort (ingen
 * fargeblokk-rotasjon — cover-art-et gir fargen) med ett fremhevet kort for
 * siste episode. Presentasjons-only.
 */
export function PodcastGrid({
  episodes,
  featureFirst = true,
  className,
}: PodcastGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {episodes.map((episode, index) => {
        const { id, featured, ...rest } = episode;
        return (
          <PodcastCard
            key={id}
            {...rest}
            featured={featured ?? (featureFirst && index === 0)}
          />
        );
      })}
    </div>
  );
}
