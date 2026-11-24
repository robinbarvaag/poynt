import { runPaymentExpiry } from "../../events/payment-jobs";
import { paymentCheckAt } from "../../events/payment-rules";
import { events, inngest } from "../client";

/**
 * Betalte eventer: frigjør plasser som ikke ble betalt innen fristen (30 min
 * i kassen, 24 t ved opprykk fra venteliste), og gi dem videre til ventelista.
 * Sjekker hos Vipps/Stripe først, i tilfelle en betaling gikk gjennom uten at
 * webhooken kom fram.
 *
 * Hendelsesdrevet: hver gang en plass holdes av, sendes
 * `events/payment.hold-started`, og funksjonen sover til fristen. Uten ubetalte
 * plasser røres ikke databasen — en cron hvert 5. minutt holdt Neon våken hele
 * døgnet (scale-to-zero slår inn etter 5 min).
 *
 * Sikkerhetsnett én gang i timen, i tilfelle eventet ikke ble sendt eller
 * Vipps/Stripe ikke svarte. Lagt på samme minutt som `event-reminders`, så
 * databasen vekkes én gang, ikke to.
 */
export const eventPayments = inngest.createFunction(
  {
    id: "event-payments",
    name: "Eventer – frigjør ubetalte plasser",
    triggers: [
      { cron: "TZ=Europe/Oslo 5 * * * *" },
      events.eventsPaymentsRequested,
      events.eventsPaymentHoldStarted,
    ],
  },
  async ({ event, step }) => {
    if (event.name === "events/payment.hold-started") {
      const expiresAt = new Date(event.data.expiresAt);
      if (!Number.isNaN(expiresAt.getTime())) {
        await step.sleepUntil("vent-til-fristen", paymentCheckAt(expiresAt));
      }
    }
    return step.run("frigjor-ubetalte", () => runPaymentExpiry());
  }
);
