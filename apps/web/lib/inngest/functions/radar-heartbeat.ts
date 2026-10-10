import { db, eq } from "@poynt/on-poynt-db";
import { onPoyntRadarRun } from "@poynt/on-poynt-db/schema";
import { inngest } from "../client";

/**
 * Fase 0 bevis-jobb: beviser at hele Inngest-pipelinen lever ende-til-ende ved å
 * skrive en `radar_run`-rad. Erstattes/utvides av `radar/analyze` i Fase 1.
 *
 * Kjører ukentlig (mandag 06:00) som en enkel hjerteslagsjekk.
 */
export const radarHeartbeat = inngest.createFunction(
  { id: "radar-heartbeat", name: "Radar – hjerteslag" },
  { cron: "0 6 * * 1" },
  async ({ step }) => {
    const runId = await step.run("start-run", async () => {
      const [row] = await db
        .insert(onPoyntRadarRun)
        .values({ trigger: "heartbeat", status: "running" })
        .returning({ id: onPoyntRadarRun.id });
      return row.id;
    });

    await step.run("finish-run", async () => {
      await db
        .update(onPoyntRadarRun)
        .set({
          status: "ok",
          finishedAt: new Date(),
          stats: { note: "heartbeat ok" },
        })
        .where(eq(onPoyntRadarRun.id, runId));
    });

    return { runId };
  }
);
