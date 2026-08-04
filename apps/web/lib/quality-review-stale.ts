import {
  serializeBlogPostContent,
  serializeCaseStudyContent,
  serializePageContent,
  serializeProductContent,
  serializeServiceContent,
} from "@/lib/quality-review-content";
import {
  hashGuideContent,
  serializeGuideContent,
} from "@/lib/serialize-guide-content";
import type {
  BlogPost,
  CaseStudy,
  Guide,
  Page,
  Product,
  Service,
} from "@/payload-types";

/**
 * Delt «er kvalitetsvurderingen utdatert?»-logikk. Ett sted vet hvilke
 * collections som har kvalitetsfelt, hvordan innholdet deres serialiseres og
 * hvordan det hashes — brukt av /api/ai/quality-review (lagrer hash),
 * stale-stripa i admin, kvalitetsdashboardet og Innholdsradaren.
 *
 * Ferskhet avgjøres ved å re-serialisere dokumentet og sammenligne hash med
 * `qualityReview.contentHash` fra forrige vurdering — IKKE via updatedAt, som
 * bumpes av alle lagringer (inkludert den som skriver selve vurderingen).
 */

export const QUALITY_COLLECTIONS = [
  "guides",
  "pages",
  "blog-posts",
  "case-studies",
  "services",
  "products",
] as const;

export type QualityCollectionSlug = (typeof QUALITY_COLLECTIONS)[number];

export function isQualityCollection(
  slug: string
): slug is QualityCollectionSlug {
  return (QUALITY_COLLECTIONS as readonly string[]).includes(slug);
}

const SERIALIZERS: Record<QualityCollectionSlug, (doc: unknown) => string> = {
  guides: (doc) => serializeGuideContent(doc as Guide),
  pages: (doc) => serializePageContent(doc as Page),
  "blog-posts": (doc) => serializeBlogPostContent(doc as BlogPost),
  "case-studies": (doc) => serializeCaseStudyContent(doc as CaseStudy),
  services: (doc) => serializeServiceContent(doc as Service),
  products: (doc) => serializeProductContent(doc as Product),
};

export function serializeQualityContent(
  slug: QualityCollectionSlug,
  doc: unknown
): string {
  return SERIALIZERS[slug](doc);
}

export function hashQualityContent(serialized: string): string {
  return hashGuideContent(serialized);
}

/** Kvalitetsfeltene slik de ligger på dokumentene (fields/quality-review.ts). */
export interface QualityDocFields {
  qualityScore?: number | null;
  qualityReviewedAt?: string | null;
  qualityReview?: { contentHash?: string } | null;
}

export type QualityStatus =
  | "unreviewed" // aldri vurdert
  | "stale" // vurdert, men innholdet er endret siden
  | "fresh"; // vurdert, og innholdet er uendret

export interface QualityStaleInfo {
  status: QualityStatus;
  score: number | null;
  reviewedAt: string | null;
}

/** Re-serialiserer dokumentet og sammenligner hash med forrige vurdering. */
export function getQualityStaleInfo(
  slug: QualityCollectionSlug,
  doc: QualityDocFields & Record<string, unknown>
): QualityStaleInfo {
  const score = typeof doc.qualityScore === "number" ? doc.qualityScore : null;
  const reviewedAt = doc.qualityReviewedAt ?? null;
  const storedHash = doc.qualityReview?.contentHash;

  if (score === null && !storedHash) {
    return { status: "unreviewed", score, reviewedAt };
  }
  if (!storedHash) {
    // Gammel vurdering uten hash (før hashen ble innført) → regn som utdatert.
    return { status: "stale", score, reviewedAt };
  }

  const currentHash = hashQualityContent(serializeQualityContent(slug, doc));
  return {
    status: currentHash === storedHash ? "fresh" : "stale",
    score,
    reviewedAt,
  };
}
