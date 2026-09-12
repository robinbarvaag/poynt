import { firstHeroImage } from "@/lib/seo";
import { lexicalToMarkdown } from "./lexical-markdown";
import type { SeoCollection, SeoInput, SeoMedia } from "./seo";
import { type Payload, relationId } from "./util";

/**
 * Bro mellom Payload-dokumenter og de rene SEO-reglene i ./seo: løs, felles
 * dokumentform på tvers av innholdstyper + innlasting av bildene reglene
 * trenger (dimensjoner, alt, mimetype).
 */

export type SeoDoc = {
  id: number;
  slug?: string;
  title?: string;
  name?: string;
  customer?: string;
  excerpt?: string | null;
  shortDescription?: string | null;
  _status?: string | null;
  unlisted?: boolean | null;
  active?: boolean | null;
  testProduct?: boolean | null;
  publishedAt?: string | null;
  updatedAt?: string;
  featuredImage?: unknown;
  image?: unknown;
  layout?: unknown;
  content?: unknown;
  categories?: unknown[] | null;
  results?: unknown;
  quote?: unknown;
  faq?: { question: string; answer: string }[] | null;
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: unknown;
    noIndex?: boolean | null;
    canonicalUrl?: string | null;
    ogType?: string | null;
  } | null;
};

/** Hovedbilde-fallback per innholdstype (samme som generateMetadata). */
export function fallbackImageId(
  collection: SeoCollection | "homepage",
  doc: SeoDoc
): number | undefined {
  switch (collection) {
    case "pages":
    case "homepage":
      return relationId(firstHeroImage(doc.layout));
    case "services":
      return relationId(doc.image);
    default:
      return relationId(doc.featuredImage);
  }
}

/** Henter alle bilder dokumentene bruker til delingskort, i én spørring. */
export async function loadMedia(
  payload: Payload,
  docs: { collection?: SeoCollection | "homepage"; doc: SeoDoc }[] | SeoDoc[]
): Promise<Map<number, SeoMedia>> {
  const ids = new Set<number>();
  for (const entry of docs) {
    const { doc, collection } =
      "doc" in entry ? entry : { doc: entry, collection: undefined };
    const metaId = relationId(doc.meta?.image);
    if (metaId) ids.add(metaId);
    const fallback = collection
      ? fallbackImageId(collection, doc)
      : (relationId(doc.featuredImage) ?? relationId(doc.image));
    if (fallback) ids.add(fallback);
  }
  if (!ids.size) return new Map();
  const res = await payload.find({
    collection: "media",
    where: { id: { in: [...ids] } },
    depth: 0,
    limit: ids.size,
  });
  return new Map(
    res.docs.map((m) => [
      m.id,
      {
        id: m.id,
        url: m.url,
        alt: m.alt,
        width: m.width,
        height: m.height,
        mimeType: m.mimeType,
        filename: m.filename,
        sizes: { og: { url: m.sizes?.og?.url } },
      },
    ])
  );
}

export function seoInputFor(
  collection: SeoCollection | "homepage",
  doc: SeoDoc,
  media: Map<number, SeoMedia>
): SeoInput {
  const metaImageId = relationId(doc.meta?.image);
  const fallbackId = fallbackImageId(collection, doc);
  const article = collection === "blog-posts" || collection === "case-studies";
  return {
    collection,
    title:
      collection === "homepage"
        ? "Poynt – Din læringsplattform for kurs og opplæring"
        : (doc.title ?? doc.name ?? ""),
    slug: doc.slug,
    metaTitle: doc.meta?.title,
    metaDescription: doc.meta?.description,
    excerpt: doc.excerpt ?? doc.shortDescription,
    noIndex: doc.meta?.noIndex || doc.testProduct,
    canonicalUrl: doc.meta?.canonicalUrl,
    unlisted: doc.unlisted,
    metaImage: metaImageId ? media.get(metaImageId) : undefined,
    fallbackImage: fallbackId ? media.get(fallbackId) : undefined,
    contentMarkdown: article ? lexicalToMarkdown(doc.content) : undefined,
  };
}
