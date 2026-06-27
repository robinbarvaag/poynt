"use server";

import { inngest } from "@/lib/inngest/client";
import { db, eq, sql } from "@poynt/planner-db";
import {
  plannerInspirationItem,
  plannerInspirationSource,
} from "@poynt/planner-db/schema";
import type { InspirationSourceTypeValue } from "@poynt/planner-validators";

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
  const [created] = await db
    .insert(plannerInspirationSource)
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
  const [updated] = await db
    .update(plannerInspirationSource)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(plannerInspirationSource.id, id))
    .returning();
  return updated;
}

export async function deleteInspirationSource(id: string) {
  // Rydd opp i destillerte items først (ingen FK-cascade i schemaet).
  await db
    .delete(plannerInspirationItem)
    .where(eq(plannerInspirationItem.sourceId, id));
  await db
    .delete(plannerInspirationSource)
    .where(eq(plannerInspirationSource.id, id));
  return { success: true };
}

export async function toggleInspirationSourceActive(id: string) {
  const [current] = await db
    .select({ isActive: plannerInspirationSource.isActive })
    .from(plannerInspirationSource)
    .where(eq(plannerInspirationSource.id, id))
    .limit(1);
  if (!current) return { success: false };

  const [updated] = await db
    .update(plannerInspirationSource)
    .set({ isActive: !current.isActive, updatedAt: sql`now()` })
    .where(eq(plannerInspirationSource.id, id))
    .returning();
  return updated;
}

/**
 * Trigger henting nå. Uten id hentes alle aktive kilder; med id hentes kun den.
 * Kjører som Inngest-bakgrunnsjobb; UI oppdaterer seg ved refresh.
 */
export async function fetchInspirationNow(sourceId?: string) {
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
