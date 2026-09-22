import { EventSchemas, Inngest } from "inngest";

/**
 * Inngest-event-katalog for On Poynt. Hold den typed slik at funksjoner og
 * `inngest.send(...)` deler nøyaktig samme nyttelast. Se docs/CONTENT-RADAR.md.
 */
type Events = {
  // Be radaren analysere biblioteket på nytt (fra «Kjør radaren nå»-knappen).
  "radar/analyze.requested": {
    data: { trigger: "manual" | "scheduled" };
  };
  // Hent og destiller eksterne inspirasjonskilder.
  "inspiration/fetch.requested": {
    data: { sourceId?: string };
  };
  // Rydd personopplysninger fra gamle event-påmeldinger (kjører også hver natt).
  "events/retention.requested": {
    data: { dryRun?: boolean };
  };
  // Send påminnelser for eventer som starter innen et døgn (kjører også hver time).
  "events/reminders.requested": {
    data: { dryRun?: boolean };
  };
  // Frigjør ubetalte plasser på betalte eventer (kjører også hvert 5. minutt).
  "events/payments.requested": {
    data: Record<string, never>;
  };
  // Hent lagerstatus for boka hos Norli/ARK (kjører også hver morgen).
  "boksalg/snapshot.requested": {
    data: { sourceKey?: string };
  };
};

export const inngest = new Inngest({
  id: "poynt",
  schemas: new EventSchemas().fromRecord<Events>(),
});
