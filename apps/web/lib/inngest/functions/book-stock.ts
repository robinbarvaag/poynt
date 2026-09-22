import config from "@/payload.config";
import { getPayload } from "payload";
import { runStockSnapshot } from "../../boksalg/snapshot";
import { inngest } from "../client";

/**
 * Boksalg — henter lagerstatus for «Verdifull vekst» hos Norli og ARK, lagrer
 * et lagerbilde og skriver endringene til endringsloggen.
 *
 * Triggere: hver morgen 06:00 UTC (08:00 norsk sommertid) + on-demand via
 * «Hent nå» i dashbordet (event `boksalg/snapshot.requested`).
 *
 * Én gang i døgnet er et bevisst valg: butikkenes lagertall oppdateres uansett
 * ikke oftere, og vi vil ikke hamre på Norlis GraphQL. Baksiden er at to salg
 * og ett påfyll i samme butikk samme dag ser ut som ett salg — det er prisen
 * for å lese lager i stedet for kassaapparater, og den står i dokumentasjonen.
 */
export const bookStockSnapshot = inngest.createFunction(
  {
    id: "book-stock-snapshot",
    name: "Boksalg – hent lagerstatus",
    // Hentingen tar sekunder, men vi vil aldri ha to kjøringer i parallell:
    // begge ville lest samme «forrige bilde» og skrevet endringene dobbelt.
    concurrency: { limit: 1 },
    retries: 2,
  },
  [{ cron: "0 6 * * *" }, { event: "boksalg/snapshot.requested" }],
  async ({ event, step }) => {
    const sourceKey =
      event.name === "boksalg/snapshot.requested"
        ? event.data?.sourceKey
        : undefined;

    const result = await step.run("hent-lagerstatus", async () => {
      const payload = await getPayload({ config });
      return runStockSnapshot(payload, { sourceKey });
    });

    return result;
  }
);
