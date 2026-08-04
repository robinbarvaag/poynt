import {
  type PodcastEpisodeCard,
  toPodcastEpisodeCard,
} from "@/lib/podcast-cards";
import { fetchPodcastEpisodes } from "@/lib/podcast-rss";
import {
  BlockSection,
  Container,
  Heading,
  SectionHeader,
  Text,
} from "@poynt/ui";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

interface PodcastArchiveBlockProps {
  title?: string;
  description?: string;
  limit?: number;
  showMoreLink?: boolean;
}

/**
 * «Fra podkasten» på forsiden. Henter episodene fra RSS-feeden
 * (`PODCAST_RSS_URL` — Avdelingsmøte med Poynt). Rendrer ingenting (null) hvis
 * feed mangler eller er tom — selv-pakket i BlockSection så det ikke blir en
 * tom seksjon.
 */
export async function PodcastArchiveBlock({
  title,
  description,
  limit = 6,
  showMoreLink = true,
}: PodcastArchiveBlockProps) {
  const feedUrl = process.env.PODCAST_RSS_URL;
  if (!feedUrl) {
    return null;
  }

  const all = await fetchPodcastEpisodes(feedUrl);
  const total = all.length;
  const episodes: PodcastEpisodeCard[] = (
    limit ? all.slice(0, limit) : all
  ).map((episode) =>
    toPodcastEpisodeCard(episode, {
      withYear: false,
      coverClassName:
        "size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]",
    })
  );

  if (!episodes.length) {
    return null;
  }

  return (
    <BlockSection background="default" containerSize={false}>
      <Container padding="none">
        <SectionHeader title={title} intro={description} reveal={false} />

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
      </Container>
    </BlockSection>
  );
}

/** Ett episode-kort — lenker ut til episoden hos Spotify. */
function EpisodeTile({ episode }: { episode: PodcastEpisodeCard }) {
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
