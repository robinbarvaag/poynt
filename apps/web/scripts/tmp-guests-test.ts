/**
 * MIDLERTIDIG (ikke commit): prøv følge-logikken mot testeventet. Sender
 * INGEN e-post (funksjonene her sender ikke; kun API-rutene gjør det).
 * Rydder opp etter seg og setter plasser tilbake til 2.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-guests-test.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import {
  cancelRegistration,
  registerForEvent,
} from "../lib/events/registrations";

const payload = await getPayload({ config });
const log = (msg: string) => payload.logger.info(msg);

const { docs } = await payload.find({
  collection: "events",
  where: { slug: { equals: "testevent-e2e" } },
  limit: 1,
  depth: 0,
});
const event = docs[0];
if (!event) process.exit(1);

const setEvent = (data: { capacity: number; maxGuests: number | null }) =>
  payload.update({
    collection: "events",
    id: event.id,
    data,
    context: { skipRevalidate: true },
  });

const statusOf = async (ids: number[]) => {
  const { docs: rows } = await payload.find({
    collection: "event-registrations",
    where: { id: { in: ids } },
    depth: 0,
    pagination: false,
  });
  return rows.map((r) => `${r.name}=${r.status}`).join(", ");
};

const created: number[] = [];
try {
  await setEvent({ capacity: 6, maxGuests: 2 });
  log("Plasser 6, maks 2 i følge (3 plasser tatt fra før)");

  const party1 = await registerForEvent({
    eventId: event.id,
    name: "Følgetest En",
    email: "robinbarvaag+folge1@gmail.com",
    answers: {},
    newsletter: false,
    guests: ["Gjest A", "Gjest B"],
  });
  if (!party1.ok) throw new Error(`party1: ${party1.message}`);
  created.push(party1.registration.id, ...party1.guests.map((g) => g.id));
  log(`Følge på 3: ${await statusOf(created)}`);

  const party2 = await registerForEvent({
    eventId: event.id,
    name: "Følgetest To",
    email: "robinbarvaag+folge2@gmail.com",
    answers: {},
    newsletter: false,
    guests: ["Gjest C"],
  });
  if (!party2.ok) throw new Error(`party2: ${party2.message}`);
  const party2Ids = [party2.registration.id, ...party2.guests.map((g) => g.id)];
  created.push(...party2Ids);
  log(`Følge på 2 (fullt): ${await statusOf(party2Ids)}`);

  const tooMany = await registerForEvent({
    eventId: event.id,
    name: "For mange",
    email: "robinbarvaag+folge3@gmail.com",
    answers: {},
    newsletter: false,
    guests: ["X", "Y", "Z"],
  });
  log(`For stort følge: ${tooMany.ok ? "GODTATT (feil!)" : tooMany.message}`);

  const cancelled = await cancelRegistration({
    registrationId: party1.registration.id,
    by: "self",
  });
  log(
    `Avmelding følge 1: ${cancelled?.cancelledGuests.length} gjester meldt av, opprykk: ${cancelled?.promoted.map((p) => p.name).join(", ") || "ingen"}`
  );
  log(`Etter avmelding: ${await statusOf(created)}`);
} finally {
  if (created.length) {
    await payload.delete({
      collection: "event-registrations",
      where: { id: { in: created } },
      overrideAccess: true,
    });
  }
  await setEvent({ capacity: 2, maxGuests: null });
  log(`Ryddet ${created.length} rader, plasser tilbake til 2`);
}
process.exit(0);
