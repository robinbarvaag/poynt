import { SITE_URL } from "@/lib/seo";
import {
  cancelVippsPayment,
  captureVippsPayment,
  createVippsPayment,
  getVippsPayment,
  refundVippsPayment,
} from "@/lib/vipps";
import type { Event, EventRegistration } from "@/payload-types";
import { stripe } from "@poynt/stripe";
import { ticketPath } from "./codes";
import {
  type PaymentProvider,
  holdExpiresAt,
  stripeSessionExpiry,
  vippsEventReference,
} from "./payment-rules";
import {
  confirmRegistrationPayment,
  findExpiredUnpaid,
  getActiveGuests,
  markRegistrationRefunded,
  releaseUnpaidRegistration,
  setPaymentReference,
} from "./registrations";

/**
 * Betaling for eventer med Vipps (ePayment) og kort (Stripe Checkout).
 * Tilstandene (holdt plass, betalt, frigjort, refundert) skrives i
 * registrations.ts; her snakker vi med leverandørene. Ingen e-post sendes
 * herfra — se notify.ts og payment-jobs.ts.
 */

export class PaymentError extends Error {}

// Samme valg som nettbutikken: vi er selger selv, og kassen er på bokmål.
const stripeSessionDefaults = {
  managed_payments: { enabled: false },
  locale: "nb",
} as const;

const returnUrl = (token: string, result: "ferdig" | "avbrutt") =>
  `${SITE_URL}${ticketPath(token)}?betaling=${result}`;

/**
 * Start betalingen for en påmelding som venter på betaling. Returnerer
 * adressen til kassen hos Vipps eller Stripe.
 */
export async function startCheckout({
  event,
  registration,
  provider,
}: {
  event: Event;
  registration: EventRegistration;
  provider: PaymentProvider;
}): Promise<string> {
  const amountKr = registration.payment?.amountKr;
  if (registration.status !== "pending_payment" || !amountKr) {
    throw new PaymentError("Påmeldingen venter ikke på betaling.");
  }
  const expiresAt = registration.payment?.expiresAt
    ? new Date(registration.payment.expiresAt)
    : holdExpiresAt("checkout");
  if (expiresAt.getTime() <= Date.now()) {
    throw new PaymentError("Fristen for å betale har gått ut.");
  }

  const partySize = 1 + (await getActiveGuests(registration.id)).length;
  const description =
    partySize > 1
      ? `${event.title} (${partySize} billetter)`
      : `${event.title} (billett)`;

  if (provider === "stripe") {
    const session = await stripe.checkout.sessions.create({
      ...stripeSessionDefaults,
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "nok",
            unit_amount: Math.round(amountKr * 100),
            product_data: { name: description.slice(0, 250) },
          },
        },
      ],
      customer_email: registration.email ?? undefined,
      metadata: {
        kind: "event",
        registrationId: String(registration.id),
        eventId: String(event.id),
      },
      payment_intent_data: {
        metadata: { kind: "event", registrationId: String(registration.id) },
      },
      expires_at: stripeSessionExpiry(expiresAt),
      success_url: returnUrl(registration.token, "ferdig"),
      cancel_url: returnUrl(registration.token, "avbrutt"),
    });
    if (!session.url) throw new PaymentError("Stripe ga ingen betalingslenke.");
    await setPaymentReference(registration.id, {
      provider,
      reference: session.id,
    });
    return session.url;
  }

  // Referansen lagres FØR personen sendes til Vipps, så webhooken finner den.
  const reference = vippsEventReference(registration.id);
  await setPaymentReference(registration.id, { provider, reference });
  const payment = await createVippsPayment({
    reference,
    amountValue: Math.round(amountKr * 100),
    description: description.slice(0, 100),
    returnUrl: returnUrl(registration.token, "ferdig"),
  });
  return payment.redirectUrl;
}

export type PaymentSync =
  /** Nettopp bekreftet — billett og kvittering skal sendes. */
  | { state: "confirmed"; registration: EventRegistration }
  /** Allerede bekreftet tidligere. */
  | { state: "paid" }
  | { state: "pending" }
  /** Fristen gikk ut: plassen er frigjort, og disse rykket opp. */
  | { state: "released"; promoted: EventRegistration[] }
  /** Betalt etter at plassen var borte — pengene er sendt tilbake. */
  | { state: "refunded_late" }
  | { state: "none" };

const holdExpired = (registration: EventRegistration) =>
  Boolean(
    registration.payment?.expiresAt &&
      new Date(registration.payment.expiresAt).getTime() <= Date.now()
  );

async function releaseIfExpired(
  registration: EventRegistration
): Promise<PaymentSync> {
  if (!holdExpired(registration)) return { state: "pending" };
  const released = await releaseUnpaidRegistration(registration.id);
  return released.released
    ? { state: "released", promoted: released.promoted }
    : { state: "pending" };
}

/**
 * Sjekk betalingen hos Stripe/Vipps og oppdater påmeldingen. Kalles fra
 * webhookene, når personen kommer tilbake fra kassen, fra billettsiden og av
 * opprydderen — trygg å kalle så ofte man vil. Avbryter personen betalingen,
 * beholdes plassen til fristen, så de kan prøve igjen fra billettsiden.
 */
export async function syncPayment(
  registration: EventRegistration
): Promise<PaymentSync> {
  const { provider, reference } = registration.payment ?? {};
  if (!provider || !reference) {
    return registration.status === "pending_payment"
      ? releaseIfExpired(registration)
      : { state: "none" };
  }

  if (provider === "stripe") {
    if (registration.payment?.paidAt) return { state: "paid" };
    const session = await stripe.checkout.sessions.retrieve(reference);
    if (session.payment_status !== "paid")
      return releaseIfExpired(registration);

    const intentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    const result = await confirmRegistrationPayment({
      registrationId: registration.id,
      stripePaymentIntentId: intentId,
    });
    if (result.outcome === "confirmed" && result.registration) {
      return { state: "confirmed", registration: result.registration };
    }
    if (result.outcome === "no_seat" && intentId) {
      await stripe.refunds.create(
        { payment_intent: intentId },
        { idempotencyKey: `event-late-${registration.id}-${intentId}` }
      );
      return { state: "refunded_late" };
    }
    return { state: "paid" };
  }

  const payment = await getVippsPayment(reference);
  if (payment.state !== "AUTHORIZED") return releaseIfExpired(registration);

  const captured = payment.aggregate?.capturedAmount?.value ?? 0;
  const result = await confirmRegistrationPayment({
    registrationId: registration.id,
  });
  if (result.outcome === "no_seat") {
    // Godkjent for sent: frigi reservasjonen (eller betal tilbake det som
    // eventuelt er trukket).
    if (captured > 0) await refundVippsPayment(reference, captured);
    else await cancelVippsPayment(reference);
    return { state: "refunded_late" };
  }
  // Vipps reserverer bare — pengene trekkes først ved capture. Gjøres også
  // på nytt hvis et tidligere forsøk feilet etter at plassen ble bekreftet.
  if (captured < payment.amount.value) {
    await captureVippsPayment(reference, payment.amount.value);
  }
  return result.outcome === "confirmed" && result.registration
    ? { state: "confirmed", registration: result.registration }
    : { state: "paid" };
}

/** Betal tilbake en betalt påmelding og merk personen og følget som refundert. */
export async function refundRegistration(registration: EventRegistration) {
  const { provider, reference, amountKr, paidAt, refundedAt } =
    registration.payment ?? {};
  if (!paidAt || !provider || !amountKr) {
    throw new PaymentError("Påmeldingen er ikke betalt.");
  }
  if (refundedAt) throw new PaymentError("Påmeldingen er allerede refundert.");

  if (provider === "stripe") {
    const intentId = registration.payment?.stripePaymentIntentId;
    if (!intentId) throw new PaymentError("Fant ikke kortbetalingen.");
    await stripe.refunds.create(
      { payment_intent: intentId },
      { idempotencyKey: `event-refund-${registration.id}` }
    );
  } else {
    if (!reference) throw new PaymentError("Fant ikke Vipps-betalingen.");
    await refundVippsPayment(reference, Math.round(amountKr * 100));
  }
  return markRegistrationRefunded(registration.id);
}

export interface ExpiredPaymentsReport {
  checked: number;
  confirmed: EventRegistration[];
  released: number;
  promoted: EventRegistration[];
}

/**
 * Frigjør plasser som ikke ble betalt i tide. Sjekker hos leverandøren først,
 * i tilfelle betalingen gikk gjennom uten at webhooken kom fram.
 */
export async function processExpiredPayments(
  now: Date = new Date()
): Promise<ExpiredPaymentsReport> {
  const expired = await findExpiredUnpaid(now);
  const report: ExpiredPaymentsReport = {
    checked: expired.length,
    confirmed: [],
    released: 0,
    promoted: [],
  };

  for (const registration of expired) {
    let sync: PaymentSync;
    try {
      sync = await syncPayment(registration);
    } catch (error) {
      console.error(
        `Betalingssjekk feilet for påmelding ${registration.id}:`,
        error instanceof Error ? error.message : error
      );
      // Leverandøren svarer ikke: la plassen stå til neste runde.
      continue;
    }
    if (sync.state === "confirmed") {
      report.confirmed.push(sync.registration);
    } else if (sync.state === "released") {
      report.released += 1;
      report.promoted.push(...sync.promoted);
    } else if (sync.state === "none" || sync.state === "pending") {
      const released = await releaseUnpaidRegistration(registration.id);
      if (released.released) {
        report.released += 1;
        report.promoted.push(...released.promoted);
      }
    }
  }
  return report;
}
