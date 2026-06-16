import { PageHero } from "@/components/page-hero";
import { PodcastCard } from "@/components/podcast-card";
import config from "@/payload.config";
import { Container } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";
import type { ComponentProps } from "react";

type PodcastCardData = ComponentProps<typeof PodcastCard>["podcast"];

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "podcastpage" });

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: pageConfig?.meta?.title || "Podkast | Poynt",
    description:
      pageConfig?.meta?.description ||
      "Lytt til alle episoder av Poynt-podkasten",
    alternates: {
      canonical: `${baseUrl}/podkast`,
    },
    openGraph: {
      title: pageConfig?.meta?.title || "Podkast | Poynt",
      description:
        pageConfig?.meta?.description ||
        "Lytt til alle episoder av Poynt-podkasten",
      url: `${baseUrl}/podkast`,
      type: "website",
      ...(pageConfig?.meta?.image &&
        typeof pageConfig.meta.image === "object" &&
        pageConfig.meta.image.url && {
          images: [{ url: pageConfig.meta.image.url }],
        }),
    },
    ...(pageConfig?.meta?.noIndex && {
      robots: { index: false, follow: false },
    }),
  };
}

export default async function PodcastPage() {
  const payload = await getPayload({ config });

  const [pageConfig, podcasts] = await Promise.all([
    payload.findGlobal({ slug: "podcastpage" }),
    payload.find({
      collection: "podcasts",
      sort: "-publishedAt",
      limit: 100,
    }),
  ]);

  const heroEnabled = pageConfig?.hero?.enabled ?? true;
  const heroTitle = pageConfig?.hero?.title || "Podkast";
  const heroDescription =
    pageConfig?.hero?.description || "Lytt til alle episoder";
  const heroImage =
    pageConfig?.hero?.image &&
    typeof pageConfig.hero.image === "object" &&
    pageConfig.hero.image.url
      ? {
          url: pageConfig.hero.image.url,
          alt: pageConfig.hero.image.alt ?? undefined,
        }
      : null;
  const emptyStateText =
    pageConfig?.emptyStateText || "Ingen episoder publisert ennå.";

  return (
    <>
      {heroEnabled && (
        <PageHero title={heroTitle} description={heroDescription} />
      )}

      <Container padding="default" className="py-8">
        {podcasts.docs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {podcasts.docs.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast as unknown as PodcastCardData}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">
            {emptyStateText}
          </p>
        )}
      </Container>
    </>
  );
}
