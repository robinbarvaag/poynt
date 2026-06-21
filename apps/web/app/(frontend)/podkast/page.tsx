import { PageHero } from "@/components/page-hero";
import { PayloadImage } from "@/components/payload-image";
import {
  PodcastExplorer,
  type PodcastExplorerEpisode,
} from "@/components/podcast-explorer";
import { fetchPodcastEpisodes } from "@/lib/podcast-rss";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import { Container } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "podcastpage" });

  const meta = pageConfig?.meta;
  return buildMetadata({
    title: meta?.title || "Podkast",
    description:
      meta?.description || "Lytt til alle episoder av Poynt-podkasten",
    path: "/podkast",
    image: meta?.image,
    noIndex: meta?.noIndex ?? undefined,
  });
}

export default async function PodcastPage() {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "podcastpage" });

  const heroEnabled = pageConfig?.hero?.enabled ?? true;
  const heroTitle = pageConfig?.hero?.title || "Podkast";
  const heroDescription =
    pageConfig?.hero?.description || "Lytt til alle episoder";
  const emptyStateText =
    pageConfig?.emptyStateText || "Ingen episoder publisert ennå.";

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Automatisk fra RSS når PODCAST_RSS_URL er satt — ellers fall tilbake til de
  // manuelle Payload-episodene (så siden virker i dag og bytter til RSS av seg
  // selv når feed-URL-en er på plass).
  const feedUrl = process.env.PODCAST_RSS_URL;
  let episodes: PodcastExplorerEpisode[];

  if (feedUrl) {
    const rss = await fetchPodcastEpisodes(feedUrl, { limit: 200 });
    episodes = rss.map((episode, index) => ({
      id: episode.id,
      href: episode.link ?? "#",
      title: episode.title,
      description: episode.description,
      episodeNumber: episode.episodeNumber,
      duration: episode.durationLabel,
      date: episode.publishedAt ? formatDate(episode.publishedAt) : undefined,
      cover: episode.coverUrl ? (
        // RSS-cover kommer fra ukjente domener → vanlig <img> (ikke next/image)
        <img
          src={episode.coverUrl}
          alt={episode.title}
          className="size-full object-cover"
        />
      ) : undefined,
      badge: index === 0 ? "Siste episode" : undefined,
      search: `${episode.title} ${episode.description ?? ""}`.toLowerCase(),
    }));
  } else {
    const podcasts = await payload.find({
      collection: "podcasts",
      sort: "-publishedAt",
      limit: 200,
    });
    episodes = podcasts.docs.map((podcast, index) => {
      const media =
        podcast.coverImage && typeof podcast.coverImage === "object"
          ? podcast.coverImage
          : null;
      return {
        id: podcast.id,
        href: `/podkast/${podcast.slug}`,
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
            className="object-cover"
          />
        ) : undefined,
        badge: index === 0 ? "Siste episode" : undefined,
        search: `${podcast.title} ${podcast.description ?? ""}`.toLowerCase(),
      };
    });
  }

  return (
    <>
      {heroEnabled && (
        <PageHero title={heroTitle} description={heroDescription} />
      )}

      <Container padding="default" className="py-8">
        <PodcastExplorer episodes={episodes} emptyStateText={emptyStateText} />
      </Container>
    </>
  );
}
