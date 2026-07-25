import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { resolveMedia } from "@/lib/payload";
import { SITE_URL, buildMetadata, notFoundMetadata } from "@/lib/seo";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";
import { detailBreadcrumbs } from "@/lib/ui-text";
import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Heading,
  Text,
} from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

/**
 * Detaljside for én kundehistorie (case-studies-collection). Samme
 * lesevisning som blogginnlegg, men med case-elementene løftet fram:
 * kunde-badge, resultat-tall og sitat — og en «Ta en prat»-CTA nederst,
 * siden dette er salgsbevis, ikke fagstoff.
 */

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

async function getCaseStudy(slug: string) {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "case-studies",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    depth: 1,
    limit: 1,
  });
  return result.docs[0] || null;
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getCaseStudy(slug);
  if (!story) {
    return notFoundMetadata("Kundehistorie ikke funnet");
  }

  return buildMetadata({
    title: story.meta?.title || story.title,
    description: story.meta?.description || story.excerpt || "",
    path: `/kundehistorier/${slug}`,
    image: story.meta?.image || story.featuredImage,
    type: "article",
    publishedTime: story.publishedAt,
    noIndex: story.meta?.noIndex ?? undefined,
    canonicalUrl: story.meta?.canonicalUrl,
  });
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const story = await getCaseStudy(slug);
  if (!story) {
    notFound();
  }

  const featuredImage = resolveMedia(story.featuredImage);
  const results = story.results ?? [];
  const quote = story.quote;

  const storyUrl = `${SITE_URL}/kundehistorier/${slug}`;
  const jsonLd = [
    articleSchema({
      title: story.title,
      description: story.meta?.description || story.excerpt,
      image: featuredImage,
      url: storyUrl,
      datePublished: story.publishedAt,
      dateModified: story.updatedAt,
    }),
    breadcrumbSchema([
      { name: "Hjem", url: SITE_URL },
      { name: "Kundehistorier", url: `${SITE_URL}/kundehistorier` },
      { name: story.title, url: storyUrl },
    ]),
  ];

  return (
    <Container size="sm" padding="default">
      <AdminBar
        collection="case-studies"
        id={String(story.id)}
        singular="kundehistorie"
      />
      <JsonLd data={jsonLd} />
      <article>
        <Breadcrumbs
          items={detailBreadcrumbs("kundehistorier", story.title)}
          className="mb-8"
        />

        <header className="mb-8">
          <div className="mb-4">
            <Badge variant="soft-saffron">{story.customer}</Badge>
          </div>

          <Heading size="h1" color="foreground" weight="bold">
            {story.title}
          </Heading>

          {story.excerpt && (
            <Text variant="lead" customStyles="mt-4">
              {story.excerpt}
            </Text>
          )}
        </header>

        {featuredImage?.url && (
          <div className="relative mb-10">
            {/* Lekent blob-pek bak bildet – samme signatur som blogg/produkt */}
            <span
              aria-hidden="true"
              className="-top-5 -left-5 absolute size-32 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-accent-3 opacity-70 blur-[2px]"
            />
            <div className="relative z-10 aspect-video w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
              <PayloadImage
                media={featuredImage}
                alt={featuredImage.alt || story.title}
                fill
                className="object-cover"
                priority
              />
              <MediaCredit media={featuredImage} />
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-10 grid grid-cols-2 gap-6 rounded-3xl bg-accent-3/40 p-8 sm:grid-cols-4">
            {results.map((r) => (
              <div key={`${r.value}-${r.label}`}>
                <span className="block whitespace-nowrap font-bold font-heading text-4xl text-primary leading-none tracking-tight">
                  {r.value}
                </span>
                <Text variant="muted" customStyles="mt-2 text-sm">
                  {r.label}
                </Text>
              </div>
            ))}
          </div>
        )}

        <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
          <RichText data={story.content} />
        </div>

        {quote?.text && (
          <figure className="mt-10 border-primary border-l-4 pl-6">
            <blockquote>
              <Text variant="lead">«{quote.text}»</Text>
            </blockquote>
            {(quote.author || quote.role) && (
              <figcaption className="mt-3">
                <Text variant="muted">
                  {[quote.author, quote.role].filter(Boolean).join(", ")}
                </Text>
              </figcaption>
            )}
          </figure>
        )}

        <div className="mt-14 text-center">
          <Text variant="muted" customStyles="mb-4">
            Vil du ha en historie som denne?
          </Text>
          <Button size="lg" asChild>
            <Link href="/kontakt">Ta en prat</Link>
          </Button>
        </div>
      </article>
    </Container>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });
  const stories = await payload.find({
    collection: "case-studies",
    where: { _status: { equals: "published" } },
    limit: 1000,
  });
  return stories.docs.map((story) => ({ slug: story.slug }));
}
