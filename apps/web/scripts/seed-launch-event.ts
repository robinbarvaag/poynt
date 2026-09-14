/**
 * Oppretter lanseringsfesten for «Verdifull vekst» som et UTKAST under
 * Innhold → Eventer, med påmelding, venteliste og billetter slått på.
 * Sted, antall plasser, program og praktisk info fylles ut i admin — de er
 * ikke bestemt ennå, og skal ikke gjettes her.
 *
 * Idempotent: finnes eventet fra før, røres det ikke (det kan være redigert).
 *
 *   bun run --cwd apps/web payload run scripts/seed-launch-event.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { richText } from "./_lexical";

const SLUG = "lanseringsfest-verdifull-vekst";

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: "events",
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
  draft: true,
});

if (existing.docs.length > 0) {
  payload.logger.info(
    `Eventet finnes allerede (/eventer/${SLUG}) — lar det være i fred.`
  );
  process.exit(0);
}

await payload.create({
  collection: "events",
  draft: true,
  data: {
    _status: "draft",
    title: "Lanseringsfest for «Verdifull vekst»",
    slug: SLUG,
    excerpt:
      "Boka er her, og det skal feires! Bli med når «Verdifull vekst – i små bedrifter» slippes. Gratis, men meld deg på så vi vet hvor mange som kommer.",
    // Foreløpig dato: torsdag 15. oktober 2026 kl. 18–21 (norsk tid).
    startsAt: "2026-10-15T16:00:00.000Z",
    endsAt: "2026-10-15T19:00:00.000Z",
    description: richText([
      "Etter lang tid med skriving er «Verdifull vekst – i små bedrifter» endelig klar. Det vil jeg feire sammen med deg.",
      "[Fyll inn: hva skjer på festen, og hvorfor bør man komme?]",
    ]),
    registrationMode: "internal",
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
    confirmationMessage:
      "Så gøy at du kommer! Jeg gleder meg til å feire boka sammen med deg.",
    eventStatus: "scheduled",
  },
});

payload.logger.info(
  `Opprettet utkast: /eventer/${SLUG}. Fyll inn sted, antall plasser, program og praktisk info i admin før du publiserer.`
);
process.exit(0);
