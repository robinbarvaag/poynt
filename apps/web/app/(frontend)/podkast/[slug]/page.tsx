import { AdminBar } from "@/components/admin-bar";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { ViewTracker } from "@/components/radar/view-tracker";
import { formatLongDate } from "@/lib/format";
import { resolveMedia } from "@/lib/payload";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import { SECTION_TITLES, detailBreadcrumbs } from "@/lib/ui-text";
import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Breadcrumbs, Container, Heading, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface PodcastPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function getSpotifyEmbedUrl(url: string): string | null {
  // Convert spotify URL to embed URL
  // https://open.spotify.com/episode/xxx -> https://open.spotify.com/embed/episode/xxx
  const match = url.match(/spotify\.com\/(episode|show)\/([a-zA-Z0-9]+)/);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  }
  return null;
}

export async function generateMetadata({
  params,
}: PodcastPageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const podcasts = await payload.find({
    collection: "podcasts",
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  });

  const podcast = podcasts.docs[0];
  if (!podcast) {
    return notFoundMetadata("Episode ikke funnet");
  }

  return buildMetadata({
    title: `${podcast.title} | Podkast | Poynt`,
    description: podcast.description ?? undefined,
    path: `/podkast/${slug}`,
    image: podcast.coverImage,
    type: "article",
  });
}

export default async function PodcastDetailPage({ params }: PodcastPageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const podcasts = await payload.find({
    collection: "podcasts",
    where: {
      slug: { equals: slug },
    },
    depth: 2,
    limit: 1,
  });

  if (podcasts.docs.length === 0) {
    notFound();
  }

  const podcast = podcasts.docs[0];
  const embedUrl = getSpotifyEmbedUrl(podcast.spotifyUrl);
  const coverImage = resolveMedia(podcast.coverImage);

  return (
    <Container size="sm" padding="default">
      <AdminBar
        collection="podcasts"
        id={String(podcast.id)}
        singular="episode"
      />
      <ViewTracker
        collection="podcasts"
        contentId={String(podcast.id)}
        slug={slug}
      />
      <article>
        <Breadcrumbs
          items={detailBreadcrumbs("podkast", podcast.title)}
          className="mb-8"
        />

        {/* Header */}
        <header className="mb-8">
          <Text
            type="div"
            variant="muted"
            customStyles="mb-4 flex items-center gap-3 text-sm"
          >
            {podcast.episodeNumber && (
              <span>Episode {podcast.episodeNumber}</span>
            )}
            {podcast.episodeNumber && podcast.duration && <span>·</span>}
            {podcast.duration && <span>{podcast.duration}</span>}
            <span>·</span>
            <span>{formatLongDate(podcast.publishedAt)}</span>
          </Text>

          <Heading variant="h1" color="foreground" weight="bold">
            {podcast.title}
          </Heading>

          {podcast.description && (
            <Text variant="lead">{podcast.description}</Text>
          )}
        </header>

        {/* Cover Image */}
        {coverImage?.url && (
          <div className="relative mx-auto mb-8 aspect-square max-w-md overflow-hidden rounded-3xl bg-muted">
            <PayloadImage
              media={coverImage}
              alt={coverImage.alt || podcast.title}
              fill
              className="object-cover"
              priority
            />
            <MediaCredit media={coverImage} />
          </div>
        )}

        {/* Spotify Embed */}
        {embedUrl && (
          <div className="mb-10">
            <iframe
              title="Spotify-spiller"
              src={embedUrl}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-2xl"
            />
          </div>
        )}

        {/* Guests */}
        {podcast.guests && podcast.guests.length > 0 && (
          <div className="mb-8 rounded-2xl bg-muted/50 p-4">
            <Heading
              variant="h3"
              color="foreground"
              weight="semibold"
              customStyles="mb-2 text-base"
            >
              {SECTION_TITLES.podcastGuests}
            </Heading>
            <ul className="space-y-1">
              {podcast.guests.map((guest) => (
                <li key={guest.id ?? guest.name}>
                  <Text type="span" color="foreground">
                    {guest.name}
                  </Text>
                  {guest.title && (
                    <Text type="span" variant="muted">
                      {" "}
                      – {guest.title}
                    </Text>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Extended Content */}
        {podcast.content && (
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
            <RichText data={podcast.content} />
          </div>
        )}
      </article>
    </Container>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const podcasts = await payload.find({
    collection: "podcasts",
    limit: 1000,
  });

  return podcasts.docs.map((podcast) => ({
    slug: podcast.slug,
  }));
}
