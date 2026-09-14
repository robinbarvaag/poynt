import type { Event } from "@/payload-types";
import { type RegistrationStatus, TICKET_STATUSES } from "./capacity";
import { ticketUrl } from "./notify";
import { getEventsPayload } from "./registrations";
import { isAnonymizedEmail } from "./retention";

/**
 * Hvem en beskjed fra «Påmeldte»-fanen går til. Avmeldte, refunderte og de
 * som ikke har betalt ferdig får aldri beskjeder herfra.
 */
export type MessageAudience = "tickets" | "waitlisted" | "all";

const AUDIENCE_STATUSES: Record<MessageAudience, RegistrationStatus[]> = {
  tickets: TICKET_STATUSES,
  waitlisted: ["waitlisted"],
  all: [...TICKET_STATUSES, "waitlisted"],
};

export function isMessageAudience(value: unknown): value is MessageAudience {
  return typeof value === "string" && value in AUDIENCE_STATUSES;
}

export interface MessageRecipient {
  email: string;
  name?: string;
  ticketUrl?: string;
}

/**
 * Mottakerne: én e-post per adresse (følge deler e-post med den som meldte
 * på), uten rader som mangler e-post eller er anonymisert.
 */
export async function getMessageRecipients(
  eventId: number,
  audience: MessageAudience
): Promise<{ event: Event; recipients: MessageRecipient[] } | null> {
  const payload = await getEventsPayload();
  const event = await payload
    .findByID({ collection: "events", id: eventId, depth: 0, draft: true })
    .catch(() => null);
  if (!event) return null;

  const { docs } = await payload.find({
    collection: "event-registrations",
    where: {
      event: { equals: eventId },
      status: { in: AUDIENCE_STATUSES[audience] },
      email: { exists: true },
    },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    // overrideAccess: billettnøkkelen er skjult for API-et, men trengs i lenken.
    overrideAccess: true,
  });

  const seen = new Set<string>();
  const recipients: MessageRecipient[] = [];
  for (const doc of docs) {
    if (!doc.email || isAnonymizedEmail(doc.email) || seen.has(doc.email)) {
      continue;
    }
    seen.add(doc.email);
    recipients.push({
      email: doc.email,
      name: doc.name,
      ticketUrl: doc.token ? ticketUrl(doc.token) : undefined,
    });
  }
  return { event, recipients };
}
