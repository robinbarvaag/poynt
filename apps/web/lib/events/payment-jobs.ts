import type { EventRegistration } from "@/payload-types";
import { notifyPaymentConfirmed, sendRegistrationEmail } from "./notify";
import {
  type PaymentSync,
  processExpiredPayments,
  syncPayment,
} from "./payments";
import { getRegistrationWithToken } from "./registrations";

/**
 * Betaling + e-post: det webhookene, billettsiden og opprydderen deler.
 * payments.ts endrer tilstand og snakker med Stripe/Vipps; her sendes det
 * som skal ut etterpå.
 */

/** E-post til dem som rykket opp fra ventelista (billett, eller «betal nå»). */
async function notifyPromoted(promoted: EventRegistration[]): Promise<void> {
  for (const registration of promoted) {
    const full = await getRegistrationWithToken(registration.id);
    if (full) await sendRegistrationEmail(full.event, full, { promoted: true });
  }
}

/**
 * Sjekk betalingen hos leverandøren og send billett/kvittering hvis den nettopp
 * ble bekreftet. Trygg å kalle fra flere steder samtidig: bare den som får
 * «confirmed» sender e-post.
 */
export async function syncAndNotify(
  registration: EventRegistration
): Promise<PaymentSync> {
  const sync = await syncPayment(registration);
  if (sync.state === "confirmed") {
    await notifyPaymentConfirmed(sync.registration.id);
  } else if (sync.state === "released") {
    await notifyPromoted(sync.promoted);
  }
  return sync;
}

/**
 * Opprydding for betalte eventer, kjørt av Inngest hvert 5. minutt
 * (lib/inngest/functions/event-payments.ts): ubetalte plasser frigjøres, og de
 * som rykker opp får e-post. Rapporten har bare antall.
 */
export async function runPaymentExpiry(now: Date = new Date()) {
  const report = await processExpiredPayments(now);

  for (const registration of report.confirmed) {
    await notifyPaymentConfirmed(registration.id);
  }
  await notifyPromoted(report.promoted);

  return {
    checked: report.checked,
    confirmed: report.confirmed.length,
    released: report.released,
    promoted: report.promoted.length,
  };
}
