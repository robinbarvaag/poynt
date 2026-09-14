import { SITE_URL } from "@/lib/seo";
import type { Event, EventRegistration } from "@/payload-types";
import { SEAT_STATUSES } from "./capacity";
import { ticketPath } from "./codes";
import {
  formatEventLocation,
  formatEventRange,
  formatEventTime,
} from "./format";
import { buildIcs } from "./ics";
import { lexicalParagraphs } from "./lexical-text";
import { ticketQrPng } from "./qr";
import { getEventsPayload } from "./registrations";
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
  if (
    registration.status === "cancelled" ||
    !registration.token ||
    !registration.email
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
    await sendEventTicketEmail({
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
  byAdmin: boolean
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
    const { totalDocs: seats } = await payload.count({
      collection: "event-registrations",
      where: {
        event: { equals: event.id },
        status: { in: SEAT_STATUSES },
      },
    });
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
      name: registration.name,
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
