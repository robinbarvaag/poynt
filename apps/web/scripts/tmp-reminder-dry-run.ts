/**
 * MIDLERTIDIG (ikke commit): prøvekjør påminnelsesjobben UTEN å sende noe,
 * med tenkte «nå»-tidspunkt.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-reminder-dry-run.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { sendDueReminders } from "../lib/events/reminders";

const payload = await getPayload({ config });

for (const when of [
  new Date().toISOString(),
  "2026-09-15T20:00:00Z",
  "2026-10-14T18:00:00Z",
]) {
  const report = await sendDueReminders({ now: new Date(when), dryRun: true });
  payload.logger.info(`Tenkt nå ${when}: ${JSON.stringify(report)}`);
}
process.exit(0);
