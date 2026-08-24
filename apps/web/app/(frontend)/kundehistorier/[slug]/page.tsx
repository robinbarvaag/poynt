import { CaseStudyView } from "@/components/views/case-study-view";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

/**
 * Detaljside for én kundehistorie (case-studies-collection). Selve visningen
 * ligger i components/views/case-study-view.tsx og deles med /forhandsvisning.
 */

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

async function getCaseStudy(slug: string) {
  "use cache";
  cacheTag("cms");
  // Invalideres via cacheTag("cms") ved publisering — se lib/revalidate-cms.ts.
  cacheLife("max");

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

// Kun publisert innhold her — forhåndsvisning av utkast bor på
// /forhandsvisning/kundehistorier/[slug], så denne ruta kan prerendres statisk.
export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const story = await getCaseStudy(slug);
  if (!story) {
    notFound();
  }

  return <CaseStudyView story={story} />;
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
