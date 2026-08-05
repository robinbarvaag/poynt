import {
  serializeBlogPostContent,
  serializeCaseStudyContent,
  serializeCourseContent,
  serializeHomepageContent,
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
  Course,
  Guide,
  Homepage,
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
  "courses",
  "pages",
  "blog-posts",
  "case-studies",
  "services",
  "products",
] as const;

export type QualityCollectionSlug = (typeof QUALITY_COLLECTIONS)[number];

/**
 * Globaler med kvalitetsvurdering. Forsiden er bygget av de samme
 * layout-blokkene som Sider og er vår viktigste salgsside, så den skal
 * vurderes på lik linje — men den har ingen id, så alle oppslag må gå via
 * `payload.findGlobal`/`updateGlobal` i stedet for `findByID`.
 */
export const QUALITY_GLOBALS = ["homepage"] as const;

export type QualityGlobalSlug = (typeof QUALITY_GLOBALS)[number];

/** Alt som kan kvalitetsvurderes — collection eller global. */
export type QualityTargetSlug = QualityCollectionSlug | QualityGlobalSlug;

export function isQualityCollection(
  slug: string
): slug is QualityCollectionSlug {
  return (QUALITY_COLLECTIONS as readonly string[]).includes(slug);
}

export function isQualityGlobal(slug: string): slug is QualityGlobalSlug {
  return (QUALITY_GLOBALS as readonly string[]).includes(slug);
}

export function isQualityTarget(slug: string): slug is QualityTargetSlug {
  return isQualityCollection(slug) || isQualityGlobal(slug);
}

const SERIALIZERS: Record<QualityTargetSlug, (doc: unknown) => string> = {
  guides: (doc) => serializeGuideContent(doc as Guide),
  courses: (doc) => serializeCourseContent(doc as Course),
  pages: (doc) => serializePageContent(doc as Page),
  "blog-posts": (doc) => serializeBlogPostContent(doc as BlogPost),
  "case-studies": (doc) => serializeCaseStudyContent(doc as CaseStudy),
  services: (doc) => serializeServiceContent(doc as Service),
  products: (doc) => serializeProductContent(doc as Product),
  homepage: (doc) => serializeHomepageContent(doc as Homepage),
};

export function serializeQualityContent(
  slug: QualityTargetSlug,
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
  slug: QualityTargetSlug,
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
