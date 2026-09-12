import {
  type PodcastEpisodeCard,
  toPodcastEpisodeCard,
} from "@/lib/podcast-cards";
import { fetchPodcastEpisodes } from "@/lib/podcast-rss";
import {
  BlockSection,
  Container,
  Coverflow,
  Heading,
  SectionHeader,
  Text,
  cn,
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

        {/*
          På mobil ville rutenettet stablet episodene under hverandre — tre
          like kort på rad leses som en liste, ikke en seksjon. Der viser vi i
          stedet coverne som en Cover Flow (ett i front, naboene dreid bak),
          med tittel og meta under det aktive. Fra `sm` og opp er det plass til
          rutenettet, og da er det bedre: alle episodene synlige på én gang.
        */}
        <div className="sm:hidden">
          <Coverflow
            bleed
            label={title ?? "Podkast-episoder"}
            items={episodes.map((episode) => ({
              id: episode.id,
              href: episode.href,
              external: true,
              cover: (
                <EpisodeCover episode={episode} className="aspect-square" />
              ),
              caption: <EpisodeCaption episode={episode} align="center" />,
            }))}
          />
        </div>

        <div className="hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
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

/** Cover-flata: bildet med play-knapp som dukker opp ved hover. */
function EpisodeCover({
  episode,
  className,
}: {
  episode: PodcastEpisodeCard;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl bg-muted", className)}
    >
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
  );
}

/** Meta-linje, tittel og ingress. Deles av rutenettet og Cover Flow-en. */
function EpisodeCaption({
  episode,
  align = "start",
}: {
  episode: PodcastEpisodeCard;
  align?: "start" | "center";
}) {
  return (
    <div className={cn("space-y-1", align === "center" && "text-center")}>
      <Text
        type="div"
        variant="muted"
        customStyles={cn(
          "flex items-center gap-1.5 text-xs",
          align === "center" && "justify-center"
        )}
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
  );
}

/** Ett episode-kort i rutenettet — lenker ut til episoden hos Spotify. */
function EpisodeTile({ episode }: { episode: PodcastEpisodeCard }) {
  return (
    <a
      href={episode.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <EpisodeCover episode={episode} className="mb-3 aspect-square" />
      <EpisodeCaption episode={episode} />
    </a>
  );
}
