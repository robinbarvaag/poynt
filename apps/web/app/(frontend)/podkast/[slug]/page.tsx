import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Container, Heading, Text } from "@poynt/ui";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

  if (podcasts.docs.length === 0) {
    return { title: "Episode ikke funnet" };
  }

  const podcast = podcasts.docs[0];
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: `${podcast.title} | Podkast | Poynt`,
    description: podcast.description || "",
    alternates: {
      canonical: `${baseUrl}/podkast/${slug}`,
    },
    openGraph: {
      title: podcast.title,
      description: podcast.description || "",
      url: `${baseUrl}/podkast/${slug}`,
      type: "article",
      ...(podcast.coverImage &&
        typeof podcast.coverImage === "object" &&
        podcast.coverImage.url && {
          images: [{ url: podcast.coverImage.url }],
        }),
    },
  };
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Container size="sm" padding="default">
      <article>
        {/* Back link */}
        <Link
          href="/podkast"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Alle episoder</span>
        </Link>

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
            <span>{formatDate(podcast.publishedAt)}</span>
          </Text>

          <Heading variant="h1" color="foreground" weight="bold">
            {podcast.title}
          </Heading>

          {podcast.description && (
            <Text variant="lead">{podcast.description}</Text>
          )}
        </header>

        {/* Cover Image */}
        {podcast.coverImage &&
          typeof podcast.coverImage === "object" &&
          podcast.coverImage.url && (
            <div className="relative mx-auto mb-8 aspect-square max-w-md overflow-hidden rounded-3xl bg-muted">
              <Image
                src={podcast.coverImage.url}
                alt={podcast.coverImage.alt || podcast.title}
                fill
                className="object-cover"
                priority
              />
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
              Gjester i denne episoden
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
