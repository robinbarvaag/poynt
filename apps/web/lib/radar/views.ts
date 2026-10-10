import { db, gte, sql } from "@poynt/on-poynt-db";
import { onPoyntContentView } from "@poynt/on-poynt-db/schema";

/**
 * Lettvekts visningstelling (Fase 4). Aggregert per (collection, contentId, dag)
 * — ingen PII. Brukes til å gjøre «promoter/gjenbruk/oppdater»-forslag datadrevne
 * i stedet for rene proxy-anslag. Se docs/CONTENT-RADAR.md.
 */

/** Collections vi teller visninger for (speiler radarens innholdsscanning). */
export const TRACKED_COLLECTIONS = ["courses", "guides", "blog-posts"] as const;
export type TrackedCollection = (typeof TRACKED_COLLECTIONS)[number];

const today = () => new Date().toISOString().slice(0, 10);

/** Teller én visning. Idempotent per dag via unik (collection, contentId, dag). */
export async function recordView(input: {
  collection: string;
  contentId: string;
  slug?: string | null;
}): Promise<void> {
  await db
    .insert(onPoyntContentView)
    .values({
      collection: input.collection,
      contentId: input.contentId,
      slug: input.slug ?? null,
      day: today(),
      count: 1,
    })
    .onConflictDoUpdate({
      target: [
        onPoyntContentView.collection,
        onPoyntContentView.contentId,
        onPoyntContentView.day,
      ],
      set: {
        count: sql`${onPoyntContentView.count} + 1`,
        slug: sql`coalesce(${onPoyntContentView.slug}, excluded.slug)`,
        updatedAt: sql`now()`,
      },
    });
}

export interface ViewAggregate {
  collection: string;
  contentId: string;
  slug: string | null;
  views: number;
}

/** Summerer visninger per innhold i et tidsvindu (dager). */
export async function getViewAggregates(
  days: number
): Promise<ViewAggregate[]> {
  const since = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const rows = await db
    .select({
      collection: onPoyntContentView.collection,
      contentId: onPoyntContentView.contentId,
      slug: sql<string | null>`max(${onPoyntContentView.slug})`,
      views: sql<number>`sum(${onPoyntContentView.count})::int`,
    })
    .from(onPoyntContentView)
    .where(gte(onPoyntContentView.day, since))
    .groupBy(onPoyntContentView.collection, onPoyntContentView.contentId);

  return rows.map((r) => ({ ...r, views: Number(r.views) }));
}
