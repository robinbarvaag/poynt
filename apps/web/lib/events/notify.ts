import { SITE_URL } from "@/lib/seo";
import type { Event, EventRegistration } from "@/payload-types";
import { SEAT_STATUSES } from "./capacity";
import { ticketPath } from "./codes";
import {
  formatEventDay,
  formatEventLocation,
  formatEventRange,
  formatEventTime,
} from "./format";
import { buildIcs } from "./ics";
import { lexicalParagraphs } from "./lexical-text";
import { ticketQrPng } from "./qr";
import {
  getActiveGuests,
  getEventsPayload,
  getRegistrationWithToken,
} from "./registrations";
import { hasAnswers } from "./retention";

/**
 * E-postene rundt en påmelding. Alt her kjøres ETTER at databasen er
 * oppdatert, og feil svelges og logges: påmeldingen er gyldig selv om
 * e-posten feiler, og billetten kan sendes på nytt fra «Påmeldte»-fanen.
 */

export function ticketUrl(token: string): string {
  return `${SITE_URL}${ticketPath(token)}`;
}

export function eventUrl(event: Pick<Event, "slug">): string {
  return `${SITE_URL}/eventer/${event.slug}`;
}

/** Kalenderfil for eventet — samme UID for alle, så den ikke dupliseres. */
export function eventIcs(event: Event): string {
  return buildIcs({
    uid: `event-${event.id}@poynt.no`,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    description: [event.excerpt, eventUrl(event)].filter(Boolean).join("\n\n"),
    location: formatEventLocation(event.location),
    url: eventUrl(event),
  });
}

function logError(what: string, error: unknown) {
  console.error(
    `Event-e-post feilet (${what}):`,
    error instanceof Error ? error.message : error
  );
}

/**
 * Billett (påmeldt/rykket opp) eller venteliste-e-post, ut fra statusen.
 * Avmeldte får ingenting.
 */
export async function sendRegistrationEmail(
  event: Event,
  registration: EventRegistration,
  opts: { promoted?: boolean; reminder?: boolean } = {}
): Promise<void> {
  // Følget har ingen e-post; billettene deres går med hovedpersonens e-post.
  if (
    registration.status === "cancelled" ||
    !registration.token ||
    !registration.email ||
    registration.guestOf
  ) {
    return;
  }
  const { sendEventTicketEmail, sendEventWaitlistEmail } = await import(
    "@poynt/email"
  );
  const url = ticketUrl(registration.token);
  const when = formatEventRange(event.startsAt, event.endsAt);
  const where = formatEventLocation(event.location) || undefined;

  try {
    // Betalt event, rykket opp fra ventelista: plassen er holdt, men må betales.
    if (registration.status === "pending_payment") {
      const amountKr = registration.payment?.amountKr;
      const expiresAt = registration.payment?.expiresAt;
      if (!amountKr || !expiresAt) return;
      const { sendEventMessageEmails } = await import("@poynt/email");
      await sendEventMessageEmails({
        eventTitle: event.title,
        when,
        subject: `Det ble plass: ${event.title}`,
        message: [
          "Noen meldte seg av, og du sto først på ventelista. Plassen er holdt av til deg!",
          `Betal ${formatKr(amountKr)} innen ${formatEventDay(expiresAt)} kl. ${formatEventTime(expiresAt)} for å få billetten. Etter det går plassen videre til nestemann på ventelista.`,
          "Trykk på knappen under for å betale med Vipps eller kort.",
        ].join("\n\n"),
        recipients: [
          {
            email: registration.email,
            name: registration.name,
            ticketUrl: url,
          },
        ],
      });
      return;
    }

    if (registration.status === "waitlisted") {
      await sendEventWaitlistEmail({
        email: registration.email,
        name: registration.name,
        eventTitle: event.title,
        when,
        where,
        position: registration.waitlistPosition ?? undefined,
        ticketUrl: url,
      });
      return;
    }

    const withTicket = event.ticketsEnabled !== false;
    const guests = await getActiveGuests(registration.id);
    await sendEventTicketEmail({
      guests: await Promise.all(
        guests.map(async (guest) => {
          const guestUrl = ticketUrl(guest.token);
          return {
            name: guest.name,
            code: withTicket ? guest.code : undefined,
            ticketUrl: guestUrl,
            qrPng: withTicket ? await ticketQrPng(guestUrl) : undefined,
          };
        })
      ),
      email: registration.email,
      name: registration.name,
      eventTitle: event.title,
      when,
      where,
      mapUrl: event.location?.mapUrl || undefined,
      doorsOpen: event.doorsOpenAt
        ? `Dørene åpner kl. ${formatEventTime(event.doorsOpenAt)}`
        : undefined,
      code: withTicket ? registration.code : undefined,
      qrPng: withTicket ? await ticketQrPng(url) : undefined,
      ticketUrl: url,
      greeting: event.confirmationMessage || undefined,
      practicalInfo: lexicalParagraphs(event.practicalInfo),
      promoted: opts.promoted,
      reminder: opts.reminder,
      ics: eventIcs(event),
    });
  } catch (error) {
    logError(`billett til ${registration.email}`, error);
  }
}

export async function sendCancellationEmail(
  event: Event,
  registration: EventRegistration,
  byAdmin: boolean,
  opts: { refundedKr?: number } = {}
): Promise<void> {
  if (!registration.email) return;
  const { sendEventCancelledEmail } = await import("@poynt/email");
  try {
    await sendEventCancelledEmail({
      email: registration.email,
      name: registration.name,
      eventTitle: event.title,
      when: formatEventRange(event.startsAt, event.endsAt),
      eventUrl: eventUrl(event),
      byAdmin,
      refundedKr: opts.refundedKr,
    });
  } catch (error) {
    logError(`avmelding til ${registration.email}`, error);
  }
}

/** Internt varsel til varslingsadressene (Nettsted-innstillinger). */
export async function notifyAdmins(
  kind: "Ny påmelding" | "Ny på venteliste" | "Avmelding",
  event: Event,
  registration: EventRegistration
): Promise<void> {
  try {
    const payload = await getEventsPayload();
    const [{ totalDocs: seats }, { totalDocs: guestCount }] = await Promise.all(
      [
        payload.count({
          collection: "event-registrations",
          where: {
            event: { equals: event.id },
            status: { in: SEAT_STATUSES },
          },
        }),
        payload.count({
          collection: "event-registrations",
          where: {
            guestOf: { equals: registration.id },
            status: { not_equals: "cancelled" },
          },
        }),
      ]
    );
    // Svar på ekstra spørsmål (f.eks. allergier) sendes IKKE på e-post: i
    // innboksen blir de liggende, mens de i databasen slettes automatisk
    // (lib/events/retention.ts). De står i «Påmeldte»-fanen.
    const answerLines = hasAnswers(registration.answers)
      ? ["Har svart på ekstra spørsmål — se «Påmeldte»-fanen i admin."]
      : [];

    const { sendEventRegistrationNotification } = await import("@poynt/email");
    const { getNotificationEmails } = await import("@/lib/notification-emails");
    await sendEventRegistrationNotification({
      to: await getNotificationEmails(),
      kind,
      name: guestCount
        ? `${registration.name} (+${guestCount} følge)`
        : registration.name,
      email: registration.email ?? undefined,
      eventTitle: event.title,
      seatsText: event.capacity
        ? `${seats} av ${event.capacity} plasser tatt`
        : `${seats} påmeldt`,
      newsletter:
        kind === "Avmelding" ? undefined : Boolean(registration.newsletter),
      answers: answerLines,
    });
  } catch (error) {
    logError("varsel til Poynt", error);
  }
}

/** Nyhetsbrev-påmelding merket med eventets navn i samtykkeloggen. */
export async function subscribeFromEvent(
  event: Event,
  registration: EventRegistration
): Promise<void> {
  if (!registration.newsletter || !registration.email) return;
  try {
    const { subscribeWithConsent } = await import("@/lib/newsletter-consent");
    const { NEWSLETTER_CONSENT_TEXTS } = await import(
      "@/lib/newsletter-consent-texts"
    );
    const result = await subscribeWithConsent({
      email: registration.email,
      source: "event",
      consentText: `${NEWSLETTER_CONSENT_TEXTS.event} (Påmelding til event: «${event.title}»)`,
      path: `/eventer/${event.slug}`,
      reference: `event:${event.id}`,
    });
    if (!result.success) {
      console.error(`Nyhetsbrev fra event feilet: ${result.error}`);
    }
  } catch (error) {
    logError("nyhetsbrev", error);
  }
}

export const formatKr = (amount: number) =>
  `${amount.toLocaleString("nb-NO", { maximumFractionDigits: 2 })} kr`;

const EVENT_WITHDRAWAL_NOTICE =
  "Billetter til arrangementer på en bestemt dato har ikke angrerett (angrerettloven § 22 bokstav m). Kan du ikke komme, er det bare å svare på billett-e-posten.";

/** Kvittering (salgsdokument med MVA og selgeropplysninger) for en betalt påmelding. */
async function sendPaymentReceipt(
  event: Event,
  registration: EventRegistration,
  partySize: number
): Promise<void> {
  const amountKr = registration.payment?.amountKr;
  if (!registration.email || !amountKr) return;
  try {
    const payload = await getEventsPayload();
    const { buildOrderEmailExtras } = await import("@/lib/order-email");
    const { sendOrderConfirmation } = await import("@poynt/email");
    const extras = await buildOrderEmailExtras(payload, []);
    await sendOrderConfirmation({
      email: registration.email,
      orderNumber: `E${registration.id}`,
      orderDate: registration.payment?.paidAt ?? new Date(),
      customerName: registration.name,
      paymentMethod:
        registration.payment?.provider === "vipps" ? "Vipps" : "Kort (Stripe)",
      items: [
        {
          name: `Billett: ${event.title}`,
          quantity: partySize,
          price: Math.round((amountKr / partySize) * 100) / 100,
          vatRate: Number(event.vatRate ?? "25"),
        },
      ],
      total: amountKr,
      subject: "Kvittering",
      content: {
        heading: "Takk for betalingen!",
        intro: `Her er kvitteringen for ${partySize === 1 ? "billetten" : "billettene"} til «${event.title}». Selve billetten kommer i en egen e-post.`,
      },
      seller: extras.seller,
      legal: { ...extras.legal, withdrawalNotice: EVENT_WITHDRAWAL_NOTICE },
    });
  } catch (error) {
    logError(`kvittering til ${registration.email}`, error);
  }
}

/**
 * Betalingen er bekreftet: billett (med følget), kvittering, internvarsel,
 * salgsvarsel og nyhetsbrev. Kalles én gang per betaling — den som fikk
 * «confirmed» fra syncPayment.
 */
export async function notifyPaymentConfirmed(
  registrationId: number
): Promise<void> {
  const registration = await getRegistrationWithToken(registrationId);
  if (!registration) return;
  const { event } = registration;
  const partySize = 1 + (await getActiveGuests(registration.id)).length;
  const amountKr = registration.payment?.amountKr ?? 0;

  await Promise.all([
    sendRegistrationEmail(event, registration),
    sendPaymentReceipt(event, registration, partySize),
    notifyAdmins("Ny påmelding", event, registration),
    subscribeFromEvent(event, registration),
    (async () => {
      try {
        const { sendSaleNotification } = await import("@poynt/email");
        const { getNotificationEmails } = await import(
          "@/lib/notification-emails"
        );
        await sendSaleNotification({
          to: await getNotificationEmails(),
          kind: "Eventbillett",
          orderNumber: `E${registration.id}`,
          customerName: registration.name,
          customerEmail: registration.email ?? "ukjent",
          items: [
            {
              name: `Billett: ${event.title}`,
              quantity: partySize,
              price: Math.round((amountKr / partySize) * 100) / 100,
            },
          ],
          total: amountKr,
          paymentProvider:
            registration.payment?.provider === "vipps" ? "Vipps" : "Stripe",
          adminUrl: `${SITE_URL}/admin/collections/events/${event.id}`,
        });
      } catch (error) {
        logError("salgsvarsel", error);
      }
    })(),
  ]);
}
