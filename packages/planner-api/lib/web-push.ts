import { db } from "@poynt/planner-db";
import { plannerPushSubscription } from "@poynt/planner-db/schema";
import { eq } from "drizzle-orm";
import webpush from "web-push";

/**
 * Web Push uten ekstern tjeneste: vi signerer med våre egne VAPID-nøkler og
 * sender krypterte payloads rett til nettleserens push-tjeneste (FCM/Mozilla
 * osv.). Levering er en enkel HTTP-request — passer perfekt på serverless.
 *
 * Krever env: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (+ valgfri
 * VAPID_SUBJECT). Mangler de, no-op-er vi (push er da bare ikke skrudd på).
 */

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hei@poynt.no";
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Send et push-varsel til alle enhetene (abonnementene) til en bruker. Døde
 * abonnement (404/410) ryddes bort underveis.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await db.query.plannerPushSubscription.findMany({
    where: eq(plannerPushSubscription.userId, userId),
  });
  if (subs.length === 0) return;

  const json = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          json
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // Abonnementet finnes ikke lenger — fjern det.
        if (statusCode === 404 || statusCode === 410) {
          await db
            .delete(plannerPushSubscription)
            .where(eq(plannerPushSubscription.endpoint, sub.endpoint));
        }
      }
    })
  );
}
