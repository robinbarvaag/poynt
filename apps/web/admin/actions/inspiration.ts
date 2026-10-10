"use server";

import { inngest } from "@/lib/inngest/client";
import { requireAdmin } from "@/lib/require-admin";
import { db, eq, sql } from "@poynt/on-poynt-db";
import {
  onPoyntInspirationItem,
  onPoyntInspirationSource,
} from "@poynt/on-poynt-db/schema";
import type { InspirationSourceTypeValue } from "@poynt/on-poynt-validators";

/**
 * Inspirasjonskilder — admin-handlinger. Partneren registrerer offentlige
 * RSS-feeds / nettsider (bevisst IKKE auth-gated profiler). Inngest-jobben
 * henter og destillerer dem. Se docs/CONTENT-RADAR.md.
 */

export async function createInspirationSource(data: {
  label: string;
  url: string;
  type: InspirationSourceTypeValue;
  personName?: string;
}) {
  await requireAdmin();
  const [created] = await db
    .insert(onPoyntInspirationSource)
    .values({
      label: data.label,
      url: data.url,
      type: data.type,
      personName: data.personName || null,
      isActive: true,
    })
    .returning();
  return created;
}

export async function updateInspirationSource(
  id: string,
  data: {
    label?: string;
    url?: string;
    type?: InspirationSourceTypeValue;
    personName?: string | null;
  }
) {
  await requireAdmin();
  const [updated] = await db
    .update(onPoyntInspirationSource)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(onPoyntInspirationSource.id, id))
    .returning();
  return updated;
}

export async function deleteInspirationSource(id: string) {
  await requireAdmin();
  // Rydd opp i destillerte items først (ingen FK-cascade i schemaet).
  await db
    .delete(onPoyntInspirationItem)
    .where(eq(onPoyntInspirationItem.sourceId, id));
  await db
    .delete(onPoyntInspirationSource)
    .where(eq(onPoyntInspirationSource.id, id));
  return { success: true };
}

export async function toggleInspirationSourceActive(id: string) {
  await requireAdmin();
  const [current] = await db
    .select({ isActive: onPoyntInspirationSource.isActive })
    .from(onPoyntInspirationSource)
    .where(eq(onPoyntInspirationSource.id, id))
    .limit(1);
  if (!current) return { success: false };

  const [updated] = await db
    .update(onPoyntInspirationSource)
    .set({ isActive: !current.isActive, updatedAt: sql`now()` })
    .where(eq(onPoyntInspirationSource.id, id))
    .returning();
  return updated;
}

/**
 * Trigger henting nå. Uten id hentes alle aktive kilder; med id hentes kun den.
 * Kjører som Inngest-bakgrunnsjobb; UI oppdaterer seg ved refresh.
 */
export async function fetchInspirationNow(sourceId?: string) {
  await requireAdmin();
  try {
    await inngest.send({
      name: "inspiration/fetch.requested",
      data: sourceId ? { sourceId } : {},
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
