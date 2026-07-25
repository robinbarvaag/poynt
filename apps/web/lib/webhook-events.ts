import type { Database } from "@poynt/planner-db";
import { eq } from "@poynt/planner-db";
import { plannerWebhookEvent } from "@poynt/planner-db/schema";

/**
 * Prøver å kravsette (claime) et webhook-event atomisk. Returnerer true hvis
 * dette kallet vant kravet (raden ble satt inn), false hvis eventet allerede
 * er kravsatt/behandlet. Unik-constrainten på event_id gjør dette trygt ved
 * samtidige leveranser.
 */
export async function claimWebhookEvent(
  db: Database,
  eventId: string,
  type: string
): Promise<boolean> {
  const inserted = await db
    .insert(plannerWebhookEvent)
    .values({ id: crypto.randomUUID(), eventId, type })
    .onConflictDoNothing({ target: plannerWebhookEvent.eventId })
    .returning({ eventId: plannerWebhookEvent.eventId });
  return inserted.length > 0;
}

/**
 * Frigir et krav etter feilet behandling, slik at leverandørens retry kan
 * kravsette eventet på nytt.
 */
export async function releaseWebhookEvent(
  db: Database,
  eventId: string
): Promise<void> {
  await db
    .delete(plannerWebhookEvent)
    .where(eq(plannerWebhookEvent.eventId, eventId));
}
