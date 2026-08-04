import {
  QUALITY_COLLECTIONS,
  type QualityCollectionSlug,
  type QualityDocFields,
  getQualityStaleInfo,
} from "@/lib/quality-review-stale";
import type { Payload } from "payload";

/**
 * Kvalitetsoversikten: alle dokumenter i de seks innholdstypene med score,
 * sist vurdert og om innholdet er endret siden forrige vurdering
 * (hash-sammenligning via lib/quality-review-stale). Brukes av
 * kvalitetsdashboardet i admin og GET /api/ai/quality-review.
 */

export const COLLECTION_LABELS: Record<QualityCollectionSlug, string> = {
  guides: "Guide",
  courses: "Kurs",
  pages: "Side",
  "blog-posts": "Blogginnlegg",
  "case-studies": "Kundehistorie",
  services: "Tjeneste",
  products: "Produkt",
};

/** Hvor innholdet bor: den offentlige nettsiden eller On Poynt-medlemsområdet. */
export type QualityArea = "site" | "on-poynt";

export const COLLECTION_AREAS: Record<QualityCollectionSlug, QualityArea> = {
  guides: "on-poynt",
  courses: "on-poynt",
  pages: "site",
  "blog-posts": "site",
  "case-studies": "site",
  services: "site",
  products: "site",
};

export interface QualityOverviewRow {
  collection: QualityCollectionSlug;
  collectionLabel: string;
  area: QualityArea;
  id: string | number;
  title: string;
  status: "unreviewed" | "stale" | "fresh";
  score: number | null;
  reviewedAt: string | null;
  updatedAt: string | null;
  isDraft: boolean;
}

type AnyQualityDoc = QualityDocFields & {
  id: string | number;
  title?: string | null;
  name?: string | null;
  updatedAt?: string | null;
  _status?: string | null;
} & Record<string, unknown>;

export function toQualityRow(
  slug: QualityCollectionSlug,
  doc: AnyQualityDoc
): QualityOverviewRow {
  const info = getQualityStaleInfo(slug, doc);
  return {
    collection: slug,
    collectionLabel: COLLECTION_LABELS[slug],
    area: COLLECTION_AREAS[slug],
    id: doc.id,
    title: doc.title ?? doc.name ?? `${COLLECTION_LABELS[slug]} #${doc.id}`,
    status: info.status,
    score: info.score,
    reviewedAt: info.reviewedAt,
    updatedAt: doc.updatedAt ?? null,
    isDraft: doc._status === "draft",
  };
}

/** Stale-status for ett dokument (stripa i «Kvalitet»-panelet). */
export async function getQualityRow(
  payload: Payload,
  slug: QualityCollectionSlug,
  id: string | number
): Promise<QualityOverviewRow | null> {
  const doc = await payload
    .findByID({ collection: slug, id, depth: 1, draft: true })
    .catch(() => null);
  return doc ? toQualityRow(slug, doc as unknown as AnyQualityDoc) : null;
}

/** Hele oversikten, nyeste først per innholdstype. */
export async function getQualityOverview(
  payload: Payload
): Promise<QualityOverviewRow[]> {
  const rows: QualityOverviewRow[] = [];
  for (const slug of QUALITY_COLLECTIONS) {
    const found = await payload.find({
      collection: slug,
      depth: 1,
      draft: true,
      limit: 300,
      sort: "-updatedAt",
    });
    for (const doc of found.docs) {
      rows.push(toQualityRow(slug, doc as unknown as AnyQualityDoc));
    }
  }
  return rows;
}
