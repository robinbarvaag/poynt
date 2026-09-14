import { sendDueReminders } from "../../events/reminders";
import { inngest } from "../client";

/**
 * Påminnelse på e-post til alle med plass, omtrent et døgn før eventet
 * (se lib/events/reminder-rules.ts). Kjører hver time; hver påmelding får
 * påminnelsen bare én gang.
 *
 * Manuelt: send `events/reminders.requested` (eller «Invoke») med
 * `{ "dryRun": true }` for å se hvor mange som ville fått den.
 */
export const eventReminders = inngest.createFunction(
  { id: "event-reminders", name: "Eventer – påminnelse dagen før" },
  [
    { cron: "TZ=Europe/Oslo 5 * * * *" },
    { event: "events/reminders.requested" },
  ],
  async ({ event, step }) => {
    // Gjelder både eget event og «Invoke» fra dashbordet; cron har ikke feltet.
    const dryRun =
      (event.data as { dryRun?: unknown } | undefined)?.dryRun === true;
    return step.run("send-paminnelser", () => sendDueReminders({ dryRun }));
  }
);
