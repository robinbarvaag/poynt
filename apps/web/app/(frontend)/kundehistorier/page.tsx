import { PageHero } from "@/components/page-hero";
import { PayloadImage } from "@/components/payload-image";
import { resolveMedia } from "@/lib/payload";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import { BlogGrid, Button, Container, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { getPayload } from "payload";

/**
 * /kundehistorier — oversikt over case-studies-collectionen (egen
 * innholdstype, IKKE blogg). Fylles automatisk etter hvert som historier
 * publiseres i admin under Innhold → Kundehistorier.
 */

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Kundehistorier",
    description:
      "Ekte historier fra folk jeg har jobbet med: hva som var utfordringen, hva vi gjorde, og hva det førte til.",
    path: "/kundehistorier",
  });
}

async function getStories() {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });
  return payload.find({
    collection: "case-studies",
    where: { _status: { equals: "published" } },
    sort: "-publishedAt",
    depth: 1,
    limit: 50,
  });
}

export default async function CaseStudiesPage() {
  const stories = await getStories();

  const items = stories.docs.map((story) => {
    const media = resolveMedia(story.featuredImage);
    return {
      id: story.id,
      href: `/kundehistorier/${story.slug}`,
      title: story.title,
      excerpt: story.excerpt ?? undefined,
      category: story.customer,
      image: media ? (
        <PayloadImage
          media={media}
          alt={media.alt || story.title}
          fill
          className="object-cover transition-transform duration-500 group-hover/post:scale-[1.03]"
        />
      ) : undefined,
    };
  });

  return (
    <>
      <PageHero
        title="Kundehistorier"
        description="Ekte historier fra folk jeg har jobbet med: hva som var utfordringen, hva vi gjorde, og hva det førte til."
        size="large"
      />

      <Container padding="default" className="py-8">
        {items.length > 0 ? (
          <BlogGrid posts={items} featureFirst />
        ) : (
          <Text variant="muted" customStyles="py-12 text-center">
            De første historiene er på vei – kom tilbake snart.
          </Text>
        )}

        <div className="mt-16 text-center">
          <Text variant="muted" customStyles="mb-4">
            Vil du bli den neste historien?
          </Text>
          <Button size="lg" asChild>
            <Link href="/kontakt">Ta en prat</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
