/**
 * Seeder et utvalg produkter (fra dagens poynt.no) så produkt-sidene og
 * produkt-blokkene har innhold. `skipSync: true` hindrer at Stripe-pluginen
 * synker disse til Stripe. Idempotent: oppdaterer hvis slug finnes, ellers
 * opprettes produktet. Norsk utkast-tekst — finpuss + ekte bilder i admin.
 *
 *   bun run --cwd apps/web payload run scripts/seed-products.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const products = [
  {
    name: "Verdifull vekst i din bedrift",
    slug: "verdifull-vekst-i-din-bedrift",
    type: "product",
    price: 399,
    shortDescription:
      "Boka som gir deg konkrete grep for å skape vekst gjennom markedsføring og kommunikasjon.",
  },
  {
    name: "Innholdsideer til LinkedIn",
    slug: "innholdsideer-til-linkedin",
    type: "pdf",
    price: 79,
    shortDescription:
      "Ferdige innholdsideer som gjør LinkedIn-jobben enklere – og mer effektiv.",
  },
  {
    name: "75 innholdsideer til Instagram",
    slug: "75-innholdsideer-til-instagram",
    type: "pdf",
    price: 79,
    shortDescription:
      "75 klare ideer til Instagram-innhold du kan ta i bruk med en gang.",
  },
  {
    name: "Tips for å lykkes med Pinterest",
    slug: "tips-for-a-lykkes-med-pinterest",
    type: "pdf",
    price: 79,
    shortDescription:
      "Praktiske tips for å få mer ut av Pinterest som markedskanal.",
  },
  {
    name: "On Poynt – medlemskap (12 måneder)",
    slug: "on-poynt-medlemskap-12-maneder",
    type: "membership",
    membershipTier: "community_ai",
    recurringInterval: 12,
    price: 24000,
    shortDescription:
      "Tilgang til fellesskap, ressurser og AI-verktøy i tolv måneder.",
  },
];

const payload = await getPayload({ config });

for (const product of products) {
  const existing = await payload.find({
    collection: "products",
    where: { slug: { equals: product.slug } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs.length > 0) {
    await payload.update({
      collection: "products",
      id: existing.docs[0].id,
      // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher produkt-skjemaet
      data: { ...product, active: true, skipSync: true } as any,
    });
    payload.logger.info(`Oppdaterte produkt: ${product.name}`);
    continue;
  }

  await payload.create({
    collection: "products",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher produkt-skjemaet
    data: { ...product, active: true, skipSync: true } as any,
  });
  payload.logger.info(`Opprettet produkt: ${product.name}`);
}

payload.logger.info("Ferdig med å seede produkter.");
process.exit(0);
