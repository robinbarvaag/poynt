/**
 * MIDLERTIDIG (ikke commit): prøv betalingsflyten mot testeventet med
 * Stripe TEST-modus og Vipps TEST-miljø. Ingen ekte penger, ingen e-post
 * (funksjonene her sender ikke). Rydder opp og gjør eventet gratis igjen.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-payment-test.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import {
  processExpiredPayments,
  startCheckout,
  syncPayment,
} from "../lib/events/payments";
import {
  findRegistrationByToken,
  getActiveGuests,
  registerForEvent,
} from "../lib/events/registrations";

const payload = await getPayload({ config });
const log = (msg: string) => payload.logger.info(msg);

if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test")) {
  log("STRIPE_SECRET_KEY er ikke en testnøkkel — avbryter.");
  process.exit(1);
}
if (!process.env.VIPPS_API_URL?.includes("apitest")) {
  log("VIPPS_API_URL peker ikke på testmiljøet — avbryter.");
  process.exit(1);
}

const { docs } = await payload.find({
  collection: "events",
  where: { slug: { equals: "testevent-e2e" } },
  limit: 1,
  depth: 0,
});
const base = docs[0];
if (!base) process.exit(1);

const setEvent = (data: Record<string, unknown>) =>
  payload.update({
    collection: "events",
    id: base.id,
    data,
    context: { skipRevalidate: true },
  });

const created: number[] = [];
try {
  // Nok plasser til testen, uansett hvem som er påmeldt fra før.
  const event = await setEvent({
    priceKr: 250,
    maxGuests: 1,
    capacity: 50,
    paymentMethods: ["vipps", "stripe"],
  });
  log("Testevent: 250 kr, maks 1 i følge, 50 plasser");

  // 1) Kort (Stripe)
  const card = await registerForEvent({
    eventId: event.id,
    name: "Betalingstest Kort",
    email: "robinbarvaag+betaling-kort@gmail.com",
    answers: {},
    newsletter: false,
    guests: ["Følge Kort"],
    paymentMethod: "stripe",
  });
  if (!card.ok) throw new Error(`kort: ${card.message}`);
  created.push(card.registration.id, ...card.guests.map((g) => g.id));
  log(
    `Påmeldt: status=${card.registration.status}, beløp=${card.registration.payment?.amountKr}, gjest=${card.guests[0]?.status}, frist=${card.registration.payment?.expiresAt}`
  );

  const stripeUrl = await startCheckout({
    event,
    registration: card.registration,
    provider: "stripe",
  });
  log(`Stripe-kasse: ${stripeUrl.slice(0, 40)}…`);

  let cardReg = await findRegistrationByToken(card.registration.token);
  if (!cardReg) throw new Error("fant ikke kort-påmeldingen igjen");
  log(`Referanse lagret: ${cardReg.payment?.reference?.slice(0, 12)}…`);
  log(`Synk før betaling: ${(await syncPayment(cardReg)).state}`);

  // Fristen går ut (uten betaling) → opprydderen frigjør plassen.
  await payload.update({
    collection: "event-registrations",
    id: cardReg.id,
    data: {
      payment: {
        ...cardReg.payment,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
    },
    overrideAccess: true,
  });
  const report = await processExpiredPayments();
  cardReg = await findRegistrationByToken(card.registration.token);
  const guests = await payload.find({
    collection: "event-registrations",
    where: { guestOf: { equals: card.registration.id } },
    depth: 0,
  });
  log(
    `Etter frist: sjekket=${report.checked}, frigjort=${report.released}, status=${cardReg?.status}, gjest=${guests.docs[0]?.status}`
  );

  // 2) Vipps
  const vipps = await registerForEvent({
    eventId: event.id,
    name: "Betalingstest Vipps",
    email: "robinbarvaag+betaling-vipps@gmail.com",
    answers: {},
    newsletter: false,
    paymentMethod: "vipps",
  });
  if (!vipps.ok) throw new Error(`vipps: ${vipps.message}`);
  created.push(vipps.registration.id);
  const vippsUrl = await startCheckout({
    event,
    registration: vipps.registration,
    provider: "vipps",
  });
  log(`Vipps-betaling: ${vippsUrl.slice(0, 40)}…`);
  const vippsReg = await findRegistrationByToken(vipps.registration.token);
  if (vippsReg) {
    log(
      `Vipps-referanse=${vippsReg.payment?.reference}, synk før betaling: ${(await syncPayment(vippsReg)).state}`
    );
    log(
      `Aktive gjester (skal være 0): ${(await getActiveGuests(vippsReg.id)).length}`
    );
  }
} finally {
  if (created.length) {
    await payload.delete({
      collection: "event-registrations",
      where: { id: { in: created } },
      overrideAccess: true,
    });
  }
  await setEvent({
    priceKr: null,
    maxGuests: null,
    capacity: 2,
    paymentMethods: ["vipps", "stripe"],
  });
  log(
    `Ryddet ${created.length} rader; testeventet er gratis igjen (2 plasser)`
  );
}
process.exit(0);
