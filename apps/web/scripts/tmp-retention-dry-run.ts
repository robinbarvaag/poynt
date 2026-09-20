/**
 * MIDLERTIDIG (ikke commit): prøvekjør rydde-jobben UTEN å endre noe, med en
 * tenkt «nå» fram i tid.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-retention-dry-run.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { applyRegistrationRetention } from "../lib/events/retention-job";

const payload = await getPayload({ config });

for (const when of [
  "2026-09-15T12:00:00Z",
  "2026-10-05T12:00:00Z",
  "2027-04-20T12:00:00Z",
]) {
  const report = await applyRegistrationRetention({
    now: new Date(when),
    dryRun: true,
  });
  payload.logger.info(`Tenkt nå ${when}: ${JSON.stringify(report)}`);
}
process.exit(0);
