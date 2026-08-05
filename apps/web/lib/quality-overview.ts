import {
  QUALITY_COLLECTIONS,
  QUALITY_GLOBALS,
  type QualityCollectionSlug,
  type QualityDocFields,
  type QualityGlobalSlug,
  type QualityTargetSlug,
  getQualityStaleInfo,
} from "@/lib/quality-review-stale";
import type { Payload } from "payload";

/**
 * Kvalitetsoversikten: alt vurderbart innhold med score, sist vurdert og om
 * innholdet er endret siden forrige vurdering (hash-sammenligning via
 * lib/quality-review-stale). Brukes av kvalitetsdashboardet i admin og
 * GET /api/ai/quality-review. Dekker både collections og globaler (Forsiden).
 */

export const COLLECTION_LABELS: Record<QualityTargetSlug, string> = {
  guides: "Guide",
  courses: "Kurs",
  pages: "Side",
  "blog-posts": "Blogginnlegg",
  "case-studies": "Kundehistorie",
  services: "Tjeneste",
  products: "Produkt",
  homepage: "Forside",
};

/** Hvor innholdet bor: den offentlige nettsiden eller On Poynt-medlemsområdet. */
export type QualityArea = "site" | "on-poynt";

export const COLLECTION_AREAS: Record<QualityTargetSlug, QualityArea> = {
  guides: "on-poynt",
  courses: "on-poynt",
  pages: "site",
  "blog-posts": "site",
  "case-studies": "site",
  services: "site",
  products: "site",
  homepage: "site",
};

/** Redigeringslenke — globaler ligger på /admin/globals/<slug>. */
export const GLOBAL_EDIT_PATHS: Record<QualityGlobalSlug, string> = {
  homepage: "/admin/globals/homepage",
};

export interface QualityOverviewRow {
  collection: QualityTargetSlug;
  /** True for globaler (Forsiden) — de har ingen id og egen redigeringslenke. */
  isGlobal?: boolean;
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
  slug: QualityTargetSlug,
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

/** Samme, for en global (Forsiden) — ingen id, så vi henter hele globalen. */
export async function getQualityGlobalRow(
  payload: Payload,
  slug: QualityGlobalSlug
): Promise<QualityOverviewRow | null> {
  const doc = await payload
    .findGlobal({ slug, depth: 1, draft: true })
    .catch(() => null);
  if (!doc) return null;
  return toGlobalQualityRow(slug, doc as unknown as AnyQualityDoc);
}

function toGlobalQualityRow(
  slug: QualityGlobalSlug,
  doc: AnyQualityDoc
): QualityOverviewRow {
  return {
    ...toQualityRow(slug, doc),
    // Globaler har ingen id — slugen er identiteten.
    id: slug,
    title: COLLECTION_LABELS[slug],
    isGlobal: true,
    isDraft: false,
  };
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
  for (const slug of QUALITY_GLOBALS) {
    const row = await getQualityGlobalRow(payload, slug);
    if (row) rows.push(row);
  }
  return rows;
}
