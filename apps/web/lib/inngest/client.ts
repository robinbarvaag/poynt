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
};

export const inngest = new Inngest({
  id: "poynt",
  schemas: new EventSchemas().fromRecord<Events>(),
});
