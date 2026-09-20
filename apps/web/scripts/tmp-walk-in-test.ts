/**
 * MIDLERTIDIG (ikke commit): prøv «Registrer på stedet» mot testeventet.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-walk-in-test.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { registerWalkIn } from "../lib/events/registrations";

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
  process.exit(1);
}
const { docs: users } = await payload.find({
  collection: "users",
  limit: 1,
  depth: 0,
});

const invalid = await registerWalkIn({
  eventId: event.id,
  name: "  ",
  userId: users[0].id,
});
payload.logger.info(`Tomt navn: ${JSON.stringify(invalid)}`);

const badEmail = await registerWalkIn({
  eventId: event.id,
  name: "Test Uten Påmelding",
  email: "ikke-en-epost",
  userId: users[0].id,
});
payload.logger.info(`Ugyldig e-post: ${JSON.stringify(badEmail)}`);

const ok = await registerWalkIn({
  eventId: event.id,
  name: "Test Uten Påmelding",
  userId: users[0].id,
});
payload.logger.info(`Gyldig: ${JSON.stringify(ok)}`);
process.exit(0);
