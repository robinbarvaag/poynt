/**
 * MIDLERTIDIG (ikke commit): publisert testevent for ende-til-ende-testen.
 * 1 plass + venteliste, så opprykk kan testes med to e-postadresser.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-e2e-test-event.ts          → opprett
 *   bun run --cwd apps/web payload run scripts/tmp-e2e-test-event.ts slett    → slett (med påmeldinger)
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { richText } from "./_lexical";

const SLUG = "testevent-e2e";
const payload = await getPayload({ config });

const existing = await payload.find({
  collection: "events",
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
  draft: true,
});

if (process.argv.includes("slett")) {
  for (const doc of existing.docs) {
    await payload.delete({ collection: "events", id: doc.id });
  }
  payload.logger.info(`Slettet ${existing.docs.length} testevent.`);
  process.exit(0);
}

if (existing.docs.length > 0) {
  payload.logger.info(
    `Testeventet finnes allerede: id ${existing.docs[0].id}, /eventer/${SLUG}`
  );
  process.exit(0);
}

const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
startsAt.setUTCHours(16, 0, 0, 0);
const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);
const doorsOpenAt = new Date(startsAt.getTime() - 30 * 60 * 1000);

const doc = await payload.create({
  collection: "events",
  draft: false,
  data: {
    _status: "published",
    title: "Testevent (slettes etter test)",
    slug: SLUG,
    excerpt:
      "Et testevent for å prøve påmelding, billett, innsjekk og venteliste. Slettes etter testen.",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    doorsOpenAt: doorsOpenAt.toISOString(),
    location: {
      name: "Poynt-kontoret",
      address: "Kirkegata 1\n4006 Stavanger",
      mapUrl: "https://maps.google.com/?q=Stavanger",
      online: false,
    },
    description: richText([
      "Dette er et testevent. Meld deg på for å se hvordan billetten ser ut.",
    ]),
    program: [
      { time: "18:00", title: "Velkommen" },
      { time: "18:30", title: "Foredrag", description: "Litt om boka." },
      { time: "20:00", title: "Mingling" },
    ],
    practicalInfo: richText([
      "Gratis parkering bak bygget. Vi serverer noe å bite i.",
    ]),
    registrationMode: "internal",
    capacity: 1,
    waitlistEnabled: true,
    ticketsEnabled: true,
    newsletterOptIn: true,
    extraQuestions: [
      {
        label: "Allergier eller andre hensyn vi bør vite om?",
        type: "textarea",
        required: false,
      },
    ],
    confirmationMessage: "Så gøy at du kommer! (Dette er en test.)",
    eventStatus: "scheduled",
  },
});

payload.logger.info(`Opprettet testevent id ${doc.id}: /eventer/${SLUG}`);
process.exit(0);
