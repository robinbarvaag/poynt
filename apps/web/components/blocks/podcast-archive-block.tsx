import { PayloadImage } from "@/components/payload-image";
import { fetchPodcastEpisodes } from "@/lib/podcast-rss";
import config from "@/payload.config";
import { BlockSection, Heading, Text } from "@poynt/ui";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { getPayload } from "payload";
import type { ReactNode } from "react";

interface PodcastArchiveBlockProps {
  title?: string;
  description?: string;
  limit?: number;
  showMoreLink?: boolean;
}

// Normalisert kort-data uavhengig av kilde (RSS eller Payload-collection).
interface EpisodeCard {
  id: string;
  href: string;
  external: boolean;
  title: string;
  description?: string;
  episodeNumber?: number;
  duration?: string;
  date?: string;
  cover?: ReactNode;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
}

/**
 * «Fra podkasten» på forsiden. Henter automatisk fra RSS når `PODCAST_RSS_URL`
 * er satt (Avdelingsmøte med Poynt), ellers fra de manuelle Payload-episodene.
 * Rendrer ingenting (null) hvis ingen episoder finnes — selv-pakket i
 * BlockSection så det ikke blir en tom seksjon.
 */
export async function PodcastArchiveBlock({
  title,
  description,
  limit = 6,
  showMoreLink = true,
}: PodcastArchiveBlockProps) {
  const feedUrl = process.env.PODCAST_RSS_URL;
  let episodes: EpisodeCard[] = [];
  let total = 0;

  if (feedUrl) {
    const rss = await fetchPodcastEpisodes(feedUrl, { limit: limit || 100 });
    const all = await fetchPodcastEpisodes(feedUrl);
    total = all.length;
    episodes = rss.map((episode) => ({
      id: episode.id,
      href: episode.link ?? "#",
      external: true,
      title: episode.title,
      description: episode.description,
      episodeNumber: episode.episodeNumber,
      duration: episode.durationLabel,
      date: episode.publishedAt ? formatDate(episode.publishedAt) : undefined,
      // RSS-cover kommer fra ukjente domener → vanlig <img> (ikke next/image).
      cover: episode.coverUrl ? (
        <img
          src={episode.coverUrl}
          alt={episode.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : undefined,
    }));
  } else {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "podcasts",
      limit: limit || 100,
      sort: "-publishedAt",
    });
    total = result.totalDocs;
    episodes = result.docs.map((podcast) => {
      const media =
        podcast.coverImage && typeof podcast.coverImage === "object"
          ? podcast.coverImage
          : null;
      return {
        id: String(podcast.id),
        href: `/podkast/${podcast.slug}`,
        external: false,
        title: podcast.title,
        description: podcast.description ?? undefined,
        episodeNumber: podcast.episodeNumber ?? undefined,
        duration: podcast.duration ?? undefined,
        date: formatDate(podcast.publishedAt),
        cover: media?.url ? (
          <PayloadImage
            media={media}
            alt={media.alt || podcast.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : undefined,
      };
    });
  }

  if (!episodes.length) {
    return null;
  }

  return (
    <BlockSection background="default" containerSize={false}>
      <div className="container mx-auto px-4">
        {(title || description) && (
          <div className="mb-8 md:mb-12">
            {title && (
              <Heading size="h2" customStyles="mb-3">
                {title}
              </Heading>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes.map((episode) => (
            <EpisodeTile key={episode.id} episode={episode} />
          ))}
        </div>

        {showMoreLink && total > (limit || 0) && (
          <div className="mt-8 text-center">
            <Link
              href="/podkast"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Se alle episoder
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </BlockSection>
  );
}

/** Ett episode-kort — felles markup for begge kilder, ekstern eller intern lenke. */
function EpisodeTile({ episode }: { episode: EpisodeCard }) {
  const body = (
    <>
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-muted">
        {episode.cover ?? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted-foreground/10">
              <Play className="ml-0.5 size-5 text-muted-foreground/40" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex size-12 items-center justify-center rounded-full bg-foreground">
            <Play className="ml-0.5 size-5 text-background" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Text
          type="div"
          variant="muted"
          customStyles="flex items-center gap-1.5 text-xs"
        >
          {episode.episodeNumber && <span>Ep. {episode.episodeNumber}</span>}
          {episode.episodeNumber && episode.duration && <span>·</span>}
          {episode.duration && <span>{episode.duration}</span>}
          {(episode.episodeNumber || episode.duration) && episode.date && (
            <span>·</span>
          )}
          {episode.date && <span>{episode.date}</span>}
        </Text>

        <Heading
          variant="h4"
          color="foreground"
          weight="medium"
          customStyles="line-clamp-2 leading-snug transition-colors group-hover:text-primary"
        >
          {episode.title}
        </Heading>

        {episode.description && (
          <Text variant="muted" customStyles="line-clamp-1">
            {episode.description}
          </Text>
        )}
      </div>
    </>
  );

  if (episode.external) {
    return (
      <a
        href={episode.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={episode.href} className="group block">
      {body}
    </Link>
  );
}
