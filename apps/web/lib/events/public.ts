import config from "@/payload.config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import { SEAT_STATUSES } from "./capacity";

/**
 * Datahenting for de offentlige eventsidene. Selve eventet caches under
 * «cms» (tømmes når noe publiseres), plass-telleren under en egen tag som
 * tømmes ved hver på-/avmelding (lib/events/registrations.ts).
 */

export async function getPublishedEvent(slug: string) {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "events",
    where: { slug: { equals: slug }, _status: { equals: "published" } },
    depth: 2,
    limit: 1,
  });
  return result.docs[0] ?? null;
}

export async function getPublishedEvents() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "events",
    where: { _status: { equals: "published" } },
    sort: "startsAt",
    depth: 1,
    limit: 200,
  });
  return result.docs;
}

/** Antall plasser som er tatt (påmeldt + møtt). */
export async function getEventSeatsTaken(eventId: number): Promise<number> {
  "use cache";
  cacheTag("cms", `event-${eventId}`);
  cacheLife("hours");

  const payload = await getPayload({ config });
  const { totalDocs } = await payload.count({
    collection: "event-registrations",
    where: {
      event: { equals: eventId },
      status: { in: SEAT_STATUSES },
    },
  });
  return totalDocs;
}
