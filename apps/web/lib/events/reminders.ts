import { sendRegistrationEmail } from "./notify";
import { getEventsPayload } from "./registrations";
import { gotTicketRecently, reminderWindow } from "./reminder-rules";

export interface ReminderReport {
  dryRun: boolean;
  events: number;
  sent: number;
  skippedRecent: number;
}

/**
 * Sender påminnelse til alle med plass på eventer som starter innen et døgn.
 * Kjøres hver time av Inngest (lib/inngest/functions/event-reminders.ts);
 * `reminderSentAt` sørger for at ingen får den to ganger.
 *
 * Rapporten inneholder bare antall — den havner i Inngest-loggen.
 */
export async function sendDueReminders({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}): Promise<ReminderReport> {
  const payload = await getEventsPayload();
  const { from, to } = reminderWindow(now);

  const { docs: events } = await payload.find({
    collection: "events",
    where: {
      _status: { equals: "published" },
      registrationMode: { equals: "internal" },
      eventStatus: { equals: "scheduled" },
      startsAt: {
        greater_than: from.toISOString(),
        less_than_equal: to.toISOString(),
      },
    },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });

  const report: ReminderReport = {
    dryRun,
    events: events.length,
    sent: 0,
    skippedRecent: 0,
  };

  for (const event of events) {
    const { docs } = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: event.id },
        status: { equals: "registered" },
        reminderSentAt: { exists: false },
        email: { exists: true },
      },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });

    for (const registration of docs) {
      if (
        gotTicketRecently(
          {
            createdAt: registration.createdAt,
            promotedAt: registration.promotedAt,
            paidAt: registration.payment?.paidAt,
          },
          now
        )
      ) {
        report.skippedRecent += 1;
        continue;
      }
      report.sent += 1;
      if (dryRun) continue;

      // Merk som sendt uansett utfall (feil svelges og logges i notify.ts):
      // en feilende e-posttjeneste skal ikke gi påminnelse hver time.
      await sendRegistrationEmail(event, registration, { reminder: true });
      await payload.update({
        collection: "event-registrations",
        id: registration.id,
        data: { reminderSentAt: new Date().toISOString() },
        depth: 0,
        overrideAccess: true,
      });
    }
  }

  return report;
}
