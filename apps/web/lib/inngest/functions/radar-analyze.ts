import { synthesizeSuggestions } from "@poynt/planner-api/lib/content-radar";
import { db, eq } from "@poynt/planner-db";
import { plannerRadarRun } from "@poynt/planner-db/schema";
import { persistSuggestions } from "../../radar/persist";
import { gatherSignals } from "../../radar/signals";
import { inngest } from "../client";

/**
 * Innholdsradar — analysejobben. Samler deterministiske signaler om biblioteket,
 * lar AI-en destillere dem til forslag, og lagrer dem med dedup + revisjonsspor.
 *
 * Triggere: ukentlig (mandag 06:00) + on-demand via «Kjør radaren nå»-knappen
 * (event `radar/analyze.requested`). Se docs/CONTENT-RADAR.md.
 */
export const radarAnalyze = inngest.createFunction(
  { id: "radar-analyze", name: "Radar – analyse" },
  [{ cron: "0 6 * * 1" }, { event: "radar/analyze.requested" }],
  async ({ event, step }) => {
    const trigger: "manual" | "scheduled" =
      event.name === "radar/analyze.requested"
        ? event.data.trigger
        : "scheduled";

    const runId = await step.run("start-run", async () => {
      const [row] = await db
        .insert(plannerRadarRun)
        .values({ trigger, status: "running" })
        .returning({ id: plannerRadarRun.id });
      return row.id;
    });

    try {
      const signals = await step.run("gather-signals", () => gatherSignals());

      if (signals.length === 0) {
        await step.run("finish-empty", async () => {
          await db
            .update(plannerRadarRun)
            .set({
              status: "ok",
              finishedAt: new Date(),
              stats: { signals: 0, note: "ingen signaler" },
            })
            .where(eq(plannerRadarRun.id, runId));
        });
        return { runId, signals: 0 };
      }

      const output = await step.run("synthesize", () =>
        synthesizeSuggestions(signals)
      );

      const stats = await step.run("persist", () =>
        persistSuggestions(output, signals, runId)
      );

      await step.run("finish-run", async () => {
        await db
          .update(plannerRadarRun)
          .set({
            status: "ok",
            finishedAt: new Date(),
            stats: { signals: signals.length, ...stats },
          })
          .where(eq(plannerRadarRun.id, runId));
      });

      return { runId, signals: signals.length, ...stats };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await step.run("finish-error", async () => {
        await db
          .update(plannerRadarRun)
          .set({ status: "error", finishedAt: new Date(), error: message })
          .where(eq(plannerRadarRun.id, runId));
      });
      throw err;
    }
  }
);
