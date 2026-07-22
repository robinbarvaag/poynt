import { AdminBar } from "@/components/admin-bar";
import { PageHero } from "@/components/page-hero";
import {
  PodcastExplorer,
  type PodcastExplorerEpisode,
} from "@/components/podcast-explorer";
import { fetchPodcastEpisodes } from "@/lib/podcast-rss";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import { Container } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

async function getPodcastPageData() {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });

  // Episodene hentes fra podkastens RSS-feed (PODCAST_RSS_URL) — Spotify er
  // sannhetskilden, ingenting vedlikeholdes manuelt i Payload.
  const feedUrl = process.env.PODCAST_RSS_URL;
  const [pageConfig, rss] = await Promise.all([
    payload.findGlobal({ slug: "podcastpage" }),
    feedUrl ? fetchPodcastEpisodes(feedUrl, { limit: 200 }) : [],
  ]);

  return { pageConfig, rss };
}

export async function generateMetadata(): Promise<Metadata> {
  const { pageConfig } = await getPodcastPageData();

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
  const { pageConfig, rss } = await getPodcastPageData();

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

  const episodes: PodcastExplorerEpisode[] = rss.map((episode, index) => ({
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

  return (
    <>
      <AdminBar global="podcastpage" singular="podkastside" />
      {heroEnabled && (
        <PageHero title={heroTitle} description={heroDescription} />
      )}

      <Container padding="default" className="py-8">
        <PodcastExplorer episodes={episodes} emptyStateText={emptyStateText} />
      </Container>
    </>
  );
}
