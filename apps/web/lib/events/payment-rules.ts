/**
 * Regler for betalte eventer. Ren logikk (testet i payment-rules.test.ts);
 * selve betalingen ligger i payments.ts og tilstandene i registrations.ts.
 */

export type PaymentProvider = "vipps" | "stripe";

export const PAYMENT_PROVIDERS: { value: PaymentProvider; label: string }[] = [
  { value: "vipps", label: "Vipps" },
  { value: "stripe", label: "Kort" },
];

/** Så lenge holdes plassen mens personen betaler. */
export const PAYMENT_HOLD_MINUTES = 30;
/** Så lenge får den som rykker opp fra ventelista på å betale. */
export const PROMOTION_HOLD_HOURS = 24;

const MINUTE_MS = 60 * 1000;

export function isPaymentProvider(value: unknown): value is PaymentProvider {
  return value === "vipps" || value === "stripe";
}

/** Prisen per person i kr, eller null når eventet er gratis. */
export function eventPriceKr(event: {
  priceKr?: number | null;
  registrationMode?: string | null;
}): number | null {
  if ((event.registrationMode ?? "internal") !== "internal") return null;
  return event.priceKr && event.priceKr > 0 ? event.priceKr : null;
}

/** Betalingsmåtene eventet tilbyr. Tomt/ugyldig oppsett = begge. */
export function paymentMethodsFor(event: {
  paymentMethods?: string[] | null;
}): PaymentProvider[] {
  const methods = (event.paymentMethods ?? []).filter(isPaymentProvider);
  return methods.length ? methods : ["vipps", "stripe"];
}

/** «1 250 kr» / «99,50 kr». */
export function formatKr(amount: number): string {
  return `${amount.toLocaleString("nb-NO", { maximumFractionDigits: 2 })} kr`;
}

/** Hele beløpet for personen og følget, i kr (to desimaler). */
export function partyAmountKr(priceKr: number, partySize: number): number {
  return Math.round(priceKr * Math.max(1, partySize) * 100) / 100;
}

/** Når en holdt plass går videre: 30 min i kassen, 24 t ved opprykk. */
export function holdExpiresAt(
  kind: "checkout" | "promotion",
  now: Date = new Date()
): Date {
  const minutes =
    kind === "checkout" ? PAYMENT_HOLD_MINUTES : PROMOTION_HOLD_HOURS * 60;
  return new Date(now.getTime() + minutes * MINUTE_MS);
}

/**
 * `expires_at` for Stripe Checkout (sekunder). Stripe krever mellom 30 min og
 * 24 t fram i tid, så fristen klemmes inn i det vinduet.
 */
export function stripeSessionExpiry(
  holdUntil: Date,
  now: Date = new Date()
): number {
  const min = now.getTime() + 31 * MINUTE_MS;
  const max = now.getTime() + (24 * 60 - 5) * MINUTE_MS;
  return Math.floor(Math.min(max, Math.max(min, holdUntil.getTime())) / 1000);
}

/** Vipps-referanse for en påmelding: unik, [a-zA-Z0-9-], 8–64 tegn. */
export function vippsEventReference(
  registrationId: number,
  random: string = crypto.randomUUID().slice(0, 8)
): string {
  return `poynt-event-${registrationId}-${random}`;
}

export function isEventVippsReference(reference: string): boolean {
  return reference.startsWith("poynt-event-");
}
