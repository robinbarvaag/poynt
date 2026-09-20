/**
 * MIDLERTIDIG (ikke commit): prøv createEventDraft fra MCP-verktøyene.
 * Oppretter et UTKAST og sletter det igjen.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-mcp-event-test.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { createEventDraft, createEventInput } from "../lib/mcp/tools-events";

const payload = await getPayload({ config });
const log = (msg: string) => payload.logger.info(msg);

const bad = await createEventDraft(
  payload,
  createEventInput.parse({
    title: "MCP-test ugyldig",
    excerpt: "Skal avvises.",
    startsAt: "2026-11-20T18:00:00+01:00",
    endsAt: "2026-11-20T17:00:00+01:00",
  })
);
log(
  `Sluttid før start: ${typeof bad === "string" ? bad : "OPPRETTET (feil!)"}`
);

const created = await createEventDraft(
  payload,
  createEventInput.parse({
    title: "MCP-test (slettes straks)",
    excerpt: "Et utkast laget av testen.",
    startsAt: "2026-11-20T18:00:00+01:00",
    endsAt: "2026-11-20T21:00:00+01:00",
    location: { name: "Testlokalet", online: false },
    description: "## Hva skjer\n\nVi tester **markdown** til rik tekst.",
    program: [{ time: "18:00", title: "Velkommen" }],
    faq: [{ question: "Koster det noe?", answer: "Nei." }],
    capacity: 40,
    maxGuests: 1,
    extraQuestions: [{ label: "Allergier?", type: "textarea" }],
  })
);
if (typeof created === "string") {
  log(`Oppretting feilet: ${created}`);
  process.exit(1);
}

const doc = await payload.findByID({
  collection: "events",
  id: created.id,
  draft: true,
  depth: 0,
});
log(
  `Opprettet #${doc.id}: status=${doc._status}, slug=${doc.slug}, startsAt=${doc.startsAt}, rik tekst=${Boolean(doc.description)}, program=${doc.program?.length}, faq=${doc.faq?.length}, spørsmål-navn=${doc.extraQuestions?.[0]?.name}, maxGuests=${doc.maxGuests}`
);

await payload.delete({ collection: "events", id: created.id });
log(`Slettet #${created.id}`);
process.exit(0);
