import {
  getOwnCategoryNames,
  listActiveSources,
  processSource,
} from "../../radar/inspiration";
import { inngest } from "../client";

/**
 * Inspirasjon — henter og destillerer eksterne, offentlige kilder, lagrer dem
 * som inspirasjons-items, og ber deretter radaren analysere på nytt slik at nye
 * «inspiration_gap»-signaler kommer med i forslagene.
 *
 * Triggere: ukentlig (mandag 05:00, en time før radar-analysen) + on-demand via
 * «Hent nå»-knappen (event `inspiration/fetch.requested`, evt. med én sourceId).
 * Concurrency-limit holder oss snille mot Firecrawl/eksterne servere.
 * Se docs/CONTENT-RADAR.md.
 */
export const inspirationFetch = inngest.createFunction(
  {
    id: "inspiration-fetch",
    name: "Inspirasjon – hent & destiller",
    concurrency: { limit: 3 },
  },
  [{ cron: "0 5 * * 1" }, { event: "inspiration/fetch.requested" }],
  async ({ event, step }) => {
    const sourceId =
      event.name === "inspiration/fetch.requested"
        ? event.data.sourceId
        : undefined;

    const sources = await step.run("list-sources", () =>
      listActiveSources(sourceId)
    );

    if (sources.length === 0) {
      return { sources: 0, inserted: 0 };
    }

    const ownCategories = await step.run("own-categories", () =>
      getOwnCategoryNames()
    );

    // Fan-out: hver kilde i sitt eget step (durable + isolert feilhåndtering).
    const results = await Promise.all(
      sources.map((source) =>
        step.run(`fetch-${source.id}`, () =>
          processSource(source, ownCategories)
        )
      )
    );

    const inserted = results.reduce((sum, r) => sum + r.inserted, 0);

    // Be radaren regenerere forslag så ferske inspirasjons-gap kommer med.
    if (inserted > 0) {
      await step.sendEvent("trigger-analyze", {
        name: "radar/analyze.requested",
        data: { trigger: "scheduled" },
      });
    }

    return {
      sources: sources.length,
      inserted,
      perSource: results,
    };
  }
);
