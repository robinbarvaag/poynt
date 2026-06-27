import { db, eq } from "@poynt/planner-db";
import { plannerRadarRun } from "@poynt/planner-db/schema";
import { inngest } from "../client";

/**
 * Fase 0 bevis-jobb: beviser at hele Inngest-pipelinen lever ende-til-ende ved å
 * skrive en `planner_radar_run`-rad. Erstattes/utvides av `radar/analyze` i Fase 1.
 *
 * Kjører ukentlig (mandag 06:00) som en enkel hjerteslagsjekk.
 */
export const radarHeartbeat = inngest.createFunction(
  { id: "radar-heartbeat", name: "Radar – hjerteslag" },
  { cron: "0 6 * * 1" },
  async ({ step }) => {
    const runId = await step.run("start-run", async () => {
      const [row] = await db
        .insert(plannerRadarRun)
        .values({ trigger: "heartbeat", status: "running" })
        .returning({ id: plannerRadarRun.id });
      return row.id;
    });

    await step.run("finish-run", async () => {
      await db
        .update(plannerRadarRun)
        .set({
          status: "ok",
          finishedAt: new Date(),
          stats: { note: "heartbeat ok" },
        })
        .where(eq(plannerRadarRun.id, runId));
    });

    return { runId };
  }
);
