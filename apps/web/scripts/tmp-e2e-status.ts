/**
 * MIDLERTIDIG (ikke commit): vis påmeldingene til testeventet, og sett
 * antall plasser.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-e2e-status.ts
 *   bun run --cwd apps/web payload run scripts/tmp-e2e-status.ts plasser=3
 */
import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "events",
  where: { slug: { equals: "testevent-e2e" } },
  limit: 1,
  depth: 0,
});
const event = docs[0];
if (!event) {
  payload.logger.info("Fant ikke testeventet.");
  process.exit(0);
}

const arg = process.argv.find((a) => a.startsWith("plasser="));
if (arg) {
  const capacity = Number(arg.split("=")[1]);
  await payload.update({
    collection: "events",
    id: event.id,
    data: { capacity },
    context: { skipRevalidate: true },
  });
  payload.logger.info(`Plasser satt til ${capacity}.`);
}

const regs = await payload.find({
  collection: "event-registrations",
  where: { event: { equals: event.id } },
  depth: 0,
  limit: 100,
  sort: "createdAt",
});
payload.logger.info(
  `Event ${event.id}, plasser: ${arg ? arg.split("=")[1] : event.capacity}`
);
for (const r of regs.docs) {
  payload.logger.info(
    `  ${r.status}${r.waitlistPosition ? ` #${r.waitlistPosition}` : ""} · ${r.name} · ${r.email} · ${r.code}`
  );
}
process.exit(0);
