import type { Database } from "@poynt/planner-db";
import { eq, lt } from "@poynt/planner-db";
import { plannerWebhookEvent } from "@poynt/planner-db/schema";

/** Behandlede events eldre enn dette trengs ikke lenger for idempotens. */
const RETENTION_DAYS = 60;

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

  // Opportunistisk opprydding: uten dette vokser tabellen for alltid.
  // Leverandørene retryer i dager, ikke måneder, så 60 dager er rikelig.
  // Fire-and-forget med svelget feil — oppryddingen skal aldri velte eventet.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  db.delete(plannerWebhookEvent)
    .where(lt(plannerWebhookEvent.processedAt, cutoff))
    .catch((error: unknown) => {
      console.error("Opprydding av webhook-events feilet:", error);
    });

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
