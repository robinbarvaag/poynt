import { Inngest, eventType, staticSchema } from "inngest";

/**
 * Inngest-event-katalog for On Poynt. Hold den typed slik at funksjoner og
 * `inngest.send(...)` deler nøyaktig samme nyttelast: bruk `events.x` som
 * trigger og `events.x.create(data)` ved sending. Se docs/CONTENT-RADAR.md.
 */
export const events = {
  // Be radaren analysere biblioteket på nytt (fra «Kjør radaren nå»-knappen).
  radarAnalyzeRequested: eventType("radar/analyze.requested", {
    schema: staticSchema<{ trigger: "manual" | "scheduled" }>(),
  }),
  // Hent og destiller eksterne inspirasjonskilder.
  inspirationFetchRequested: eventType("inspiration/fetch.requested", {
    schema: staticSchema<{ sourceId?: string }>(),
  }),
  // Rydd personopplysninger fra gamle event-påmeldinger (kjører også hver natt).
  eventsRetentionRequested: eventType("events/retention.requested", {
    schema: staticSchema<{ dryRun?: boolean }>(),
  }),
  // Send påminnelser for eventer som starter innen et døgn (kjører også hver time).
  eventsRemindersRequested: eventType("events/reminders.requested", {
    schema: staticSchema<{ dryRun?: boolean }>(),
  }),
  // Frigjør ubetalte plasser på betalte eventer nå (kjører også hver time).
  eventsPaymentsRequested: eventType("events/payments.requested", {
    schema: staticSchema<Record<string, never>>(),
  }),
  // En plass holdes av til betaling: rydd når fristen går ut
  // (sendes fra lib/events/payment-schedule.ts).
  eventsPaymentHoldStarted: eventType("events/payment.hold-started", {
    schema: staticSchema<{ expiresAt: string }>(),
  }),
  // Hent lagerstatus for boka hos Norli/ARK (kjører også hver morgen).
  boksalgSnapshotRequested: eventType("boksalg/snapshot.requested", {
    schema: staticSchema<{ sourceKey?: string }>(),
  }),
};

export const inngest = new Inngest({
  id: "poynt",
  // Inngest 4 antar sky-modus (krever signeringsnøkkel) som standard. Lokalt
  // snakker vi med dev-serveren, med mindre INNGEST_DEV er satt eksplisitt.
  ...(process.env.INNGEST_DEV === undefined &&
  process.env.NODE_ENV === "development"
    ? { isDev: true }
    : {}),
  // Inngest 4 slår på «checkpointing» (flere steg per forespørsel) som
  // standard. Vi beholder ett steg per forespørsel som i v3, så lange AI-steg
  // ikke risikerer å gå over Vercels tidsgrense i samme kall.
  checkpointing: false,
});
