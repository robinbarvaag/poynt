import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Container, H1, Lead } from "@poynt/ui";
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
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Alle episoder</span>
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            {podcast.episodeNumber && (
              <span>Episode {podcast.episodeNumber}</span>
            )}
            {podcast.episodeNumber && podcast.duration && <span>·</span>}
            {podcast.duration && <span>{podcast.duration}</span>}
            <span>·</span>
            <span>{formatDate(podcast.publishedAt)}</span>
          </div>

          <H1 className="mb-4">{podcast.title}</H1>

          {podcast.description && (
            <Lead className="mb-6">{podcast.description}</Lead>
          )}
        </header>

        {/* Cover Image */}
        {podcast.coverImage &&
          typeof podcast.coverImage === "object" &&
          podcast.coverImage.url && (
            <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden mb-8 bg-muted">
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
              src={embedUrl}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          </div>
        )}

        {/* Guests */}
        {podcast.guests && podcast.guests.length > 0 && (
          <div className="mb-8 p-4 bg-muted/50 rounded-lg">
            <h2 className="font-semibold mb-2">Gjester i denne episoden</h2>
            <ul className="space-y-1">
              {podcast.guests.map((guest, index) => (
                <li key={index} className="text-muted-foreground">
                  <span className="text-foreground">{guest.name}</span>
                  {guest.title && <span> – {guest.title}</span>}
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
