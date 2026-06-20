/**
 * Seeder tjenestene (fra dagens poynt.no). Idempotent: oppdaterer hvis slug
 * finnes, ellers opprettes tjenesten. Tjenester synker ikke til Stripe.
 * Norsk tekst hentet ordrett fra poynt.no — finpuss + ekte bilder i admin.
 *
 *   bun run --cwd apps/web payload run scripts/seed-services.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const services = [
  {
    name: "Rådgiving",
    slug: "radgiving",
    shortDescription:
      "Utnytt kunnskapen min i to timer, og få svar på det du lurer på om markedsføring eller kommunikasjon. Leveres kun digitalt.",
    priceType: "fixed",
    price: 5000,
    includesVat: true,
    ctaText: "Ta kontakt",
    sortOrder: 0,
  },
  {
    name: "Innholdsproduksjon",
    slug: "innholdsproduksjon",
    shortDescription:
      "Passer for deg som trenger bilder og video til bruk i sosiale medier. Jeg lager innhold i to timer, og du har full råderett over alt innholdet i etterkant!",
    priceType: "fixed",
    price: 15000,
    includesVat: true,
    ctaText: "Ta kontakt",
    sortOrder: 1,
  },
  {
    name: "Workshop for styret",
    slug: "workshop-for-styret",
    shortDescription:
      "Perfekt for deg som sitter i et styre og ønsker deg en skreddersydd oppdatering om AI, markedsføring og kommunikasjon.",
    priceType: "fixed",
    price: 30000,
    includesVat: true,
    ctaText: "Ta kontakt",
    sortOrder: 2,
  },
  {
    name: "Kurs og foredrag",
    slug: "kurs-og-foredrag",
    shortDescription:
      "Få skreddersydd opplegg for din bedrift! Jeg har snakket for næringsforeninger og konferanser i hele landet, og har egne priser til veldedige organisasjoner og deg som driver med utdanning.",
    priceType: "fixed",
    price: 35000,
    includesVat: true,
    ctaText: "Ta kontakt",
    sortOrder: 3,
  },
  {
    name: "Medlemskap i On Poynt",
    slug: "medlemskap-i-on-poynt",
    shortDescription:
      "Bli med i On Poynt for å skape vekst i din bedrift. Du får inspirasjon og oppdatert kunnskap om blant annet AI, markedsføring og kommunikasjon.",
    priceType: "monthly",
    price: 2000,
    includesVat: false,
    ctaText: "Bli medlem",
    ctaLink: "/on-poynt",
    sortOrder: 4,
  },
];

const payload = await getPayload({ config });

for (const service of services) {
  const existing = await payload.find({
    collection: "services",
    where: { slug: { equals: service.slug } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs.length > 0) {
    await payload.update({
      collection: "services",
      id: existing.docs[0].id,
      // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher tjeneste-skjemaet
      data: { ...service, active: true } as any,
    });
    payload.logger.info(`Oppdaterte tjeneste: ${service.name}`);
  } else {
    await payload.create({
      collection: "services",
      // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher tjeneste-skjemaet
      data: { ...service, active: true } as any,
    });
    payload.logger.info(`Opprettet tjeneste: ${service.name}`);
  }
}

payload.logger.info("Ferdig med å seede tjenester.");
process.exit(0);
