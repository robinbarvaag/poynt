"use server";

import { inngest } from "@/lib/inngest/client";
import { requireAdmin } from "@/lib/require-admin";
import { db, eq } from "@poynt/planner-db";
import {
  type ContentSuggestionStatus,
  plannerContentSuggestion,
} from "@poynt/planner-db/schema";

/**
 * Setter status på et forslag (snooze / ferdig / avvis / gjenåpne). Avviste
 * forslag gjenoppstår aldri ved ny radar-kjøring (se persist.ts).
 */
export async function setSuggestionStatus(
  id: string,
  status: ContentSuggestionStatus
) {
  await requireAdmin();
  const [updated] = await db
    .update(plannerContentSuggestion)
    .set({ status })
    .where(eq(plannerContentSuggestion.id, id))
    .returning({ id: plannerContentSuggestion.id });
  return { success: Boolean(updated) };
}

/**
 * Trigger en radar-kjøring nå ved å sende Inngest-eventet. Selve analysen
 * kjører som bakgrunnsjobb; UI-et oppdaterer seg når den er ferdig (refresh).
 */
export async function runRadarNow() {
  await requireAdmin();
  try {
    await inngest.send({
      name: "radar/analyze.requested",
      data: { trigger: "manual" },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
