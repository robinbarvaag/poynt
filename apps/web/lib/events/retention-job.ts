import { generateTicketToken } from "./codes";
import { getEventsPayload, revalidateEventSeats } from "./registrations";
import {
  anonymizedIdentity,
  hasAnswers,
  isAnonymizedEmail,
  retentionAction,
  retentionCutoff,
} from "./retention";

export interface RetentionReport {
  dryRun: boolean;
  checkedEvents: number;
  answersCleared: number;
  anonymized: number;
  events: {
    eventId: number;
    action: "clear_answers" | "anonymize";
    affected: number;
  }[];
}

/**
 * Rydder påmeldinger etter fristene i retention.ts. Trygg å kjøre så ofte man
 * vil: det som allerede er ryddet, hoppes over. Kjøres hver natt av Inngest
 * (lib/inngest/functions/event-retention.ts).
 *
 * Rapporten inneholder bare id-er og antall — aldri navn, e-post eller svar,
 * siden den havner i Inngest-loggen.
 */
export async function applyRegistrationRetention({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}): Promise<RetentionReport> {
  const payload = await getEventsPayload();

  // Eventer som startet før fristen for svar. Sluttid kan være senere, så
  // selve avgjørelsen tas per event under.
  const { docs: events } = await payload.find({
    collection: "events",
    where: { startsAt: { less_than: retentionCutoff(now).toISOString() } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });

  const report: RetentionReport = {
    dryRun,
    checkedEvents: events.length,
    answersCleared: 0,
    anonymized: 0,
    events: [],
  };

  for (const event of events) {
    const action = retentionAction(event, now);
    if (action === "keep") continue;

    const { docs } = await payload.find({
      collection: "event-registrations",
      where: { event: { equals: event.id } },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    // Rader uten e-post (registrert på stedet, følge) har fortsatt navn og
    // kode som skal anonymiseres — kjennetegnet er koden, ikke e-posten.
    const pending = docs.filter((doc) =>
      action === "anonymize"
        ? !isAnonymizedEmail(doc.email) && !doc.code.startsWith("SLETTET-")
        : hasAnswers(doc.answers)
    );
    if (pending.length === 0) continue;

    if (!dryRun) {
      for (const doc of pending) {
        await payload.update({
          collection: "event-registrations",
          id: doc.id,
          data:
            action === "anonymize"
              ? {
                  ...anonymizedIdentity(doc.id),
                  // Ny nøkkel: den gamle billettlenken slutter å virke.
                  token: generateTicketToken(),
                  answers: null,
                  newsletter: false,
                  checkedInBy: null,
                }
              : { answers: null },
          depth: 0,
          overrideAccess: true,
        });
      }
      revalidateEventSeats(event.id);
    }

    report.events.push({ eventId: event.id, action, affected: pending.length });
    if (action === "anonymize") report.anonymized += pending.length;
    else report.answersCleared += pending.length;
  }

  return report;
}
