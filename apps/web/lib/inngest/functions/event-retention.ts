import { applyRegistrationRetention } from "../../events/retention-job";
import { inngest } from "../client";

/**
 * Sletter personopplysninger fra påmeldinger til eventer etter fristene i
 * lib/events/retention.ts: svar på ekstra spørsmål 14 dager etter eventet,
 * navn og e-post (anonymisering) 6 måneder etter. Dette er løftet i
 * personvernerklæringen — ikke slå av uten å endre den.
 *
 * Kjører hver natt kl. 03:15 norsk tid. Kan også startes manuelt med
 * `events/retention.requested` (med `dryRun: true` for å se hva som ville
 * blitt ryddet).
 */
export const eventRetention = inngest.createFunction(
  { id: "event-retention", name: "Eventer – slett gamle påmeldinger" },
  [
    { cron: "TZ=Europe/Oslo 15 3 * * *" },
    { event: "events/retention.requested" },
  ],
  async ({ event, step }) => {
    const dryRun =
      event.name === "events/retention.requested" && event.data.dryRun === true;
    return step.run("rydd-pameldinger", () =>
      applyRegistrationRetention({ dryRun })
    );
  }
);
