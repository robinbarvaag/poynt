import { runPaymentExpiry } from "../../events/payment-jobs";
import { inngest } from "../client";

/**
 * Betalte eventer: frigjør plasser som ikke ble betalt innen fristen (30 min
 * i kassen, 24 t ved opprykk fra venteliste), og gi dem videre til ventelista.
 * Sjekker hos Vipps/Stripe først, i tilfelle en betaling gikk gjennom uten at
 * webhooken kom fram. Kjører hvert 5. minutt.
 */
export const eventPayments = inngest.createFunction(
  { id: "event-payments", name: "Eventer – frigjør ubetalte plasser" },
  [
    { cron: "TZ=Europe/Oslo */5 * * * *" },
    { event: "events/payments.requested" },
  ],
  async ({ step }) => step.run("frigjor-ubetalte", () => runPaymentExpiry())
);
