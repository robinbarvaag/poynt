/**
 * Seeder /om — den personlige profilen til Susanne Todnem (Poynt).
 * Idempotert: oppdaterer hvis siden finnes, ellers opprettes den.
 *
 *   bun run --cwd apps/web payload run scripts/seed-om.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { richText } from "./_lexical";

const page = {
  title: "Om",
  slug: "om",
  meta: {
    description:
      "Poynt drives av Susanne Todnem – markedsfører, rådgiver og foredragsholder som hjelper bedrifter å vokse.",
  },
  layout: [
    {
      blockType: "hero",
      title: "Hei! Jeg er Susanne Todnem",
      subtitle:
        "Markedsfører, journalist og foredragsholder – og personen bak Poynt. Jeg hjelper bedrifter med vekst gjennom AI, markedsføring og kommunikasjon.",
      tagsLabel: "Jeg jobber med:",
      tags: [
        { label: "Rådgivning" },
        { label: "Foredrag" },
        { label: "AI for bedrifter" },
        { label: "LinkedIn" },
        { label: "Styrearbeid" },
      ],
      primaryCta: { text: "Se hvordan jeg kan hjelpe", url: "/tjenester" },
      secondaryCta: { text: "Bli medlem i On Poynt", url: "/on-poynt" },
    },
    {
      blockType: "content",
      richText: richText([
        "Poynt drives av meg, Susanne Todnem. Jeg hjelper bedrifter med vekst – ofte gjennom AI, markedsføring eller kommunikasjon.",
        "Akkurat nå jobber jeg for blant annet Bouvet, Vår Energi og artisten Janove. Tidligere har jeg jobbet for blant annet Kitch'n, Norsk Dyremat, Tilbords, KRY, Mablis og NOFO.",
        "Noen av kundene mine er børsnoterte, mens andre har bare to ansatte. Du kan få rådgivning om markedsføring og kommunikasjon fra meg – eller bli medlem i On Poynt, der du får inspirasjon og oppdatert kunnskap som gjør arbeidshverdagen din lettere.",
      ]),
    },
    {
      blockType: "statsBand",
      eyebrow: "Bakgrunn",
      title: "Erfaring å lene seg på",
      variant: "primary",
      stats: [
        { value: 10, suffix: " år", label: "for egen maskin" },
        { value: 5, label: "egne bedrifter startet" },
        { value: 9, suffix: "+", label: "merkevarer jeg har jobbet med" },
      ],
    },
    {
      blockType: "content",
      richText: richText([
        "Poynt ble stiftet under palmene da jeg bodde i Australia i 2016.",
        "Tidligere har jeg jobbet i bank, IT og fintech – blant annet hos PayPal i Stockholm. Jeg har startet fem andre bedrifter og investert i en rekke lokale startups, så jeg vet hvordan det er å være gründer. Jeg har også flere styreverv i stiftelser og kommersielle AS.",
        "Nå har jeg drevet eget firma i snart ti år, og holdt foredrag på Social Media Days og i næringsforeninger rundt om i landet. Foredrag om AI for bedrifter og LinkedIn er de mest etterspurte. For tiden er jeg fast utleid til blant annet Vår Energi og Bouvet.",
        "På fritiden driver jeg nettverket Jobbkollektivet, der jeg får jobbe med noe jeg virkelig brenner for: økonomisk likestilling og gründere.",
      ]),
    },
    {
      blockType: "featureGrid",
      eyebrow: "Slik kan jeg hjelpe",
      title: "Tre måter å jobbe sammen på",
      columns: "3",
      features: [
        {
          title: "Rådgivning",
          text: "Markedsføring og kommunikasjon – fra strategi til gjennomføring.",
          linkLabel: "Se tjenester",
          linkUrl: "/tjenester",
        },
        {
          title: "Foredrag",
          text: "AI for bedrifter og LinkedIn er de mest etterspurte – holdt på Social Media Days og i næringsforeninger.",
          linkLabel: "Ta kontakt",
          linkUrl: "/kontakt",
        },
        {
          title: "On Poynt",
          text: "Bli medlem og få inspirasjon og oppdatert kunnskap som gjør arbeidshverdagen lettere.",
          linkLabel: "Bli medlem",
          linkUrl: "/on-poynt",
        },
      ],
    },
    {
      blockType: "ctaSection",
      variant: "colored",
      title: "La oss ta en prat",
      description:
        "Lurer du på om jeg kan hjelpe bedriften din? Ta kontakt for en uforpliktende samtale.",
      primaryCta: { text: "Se tjenester", url: "/tjenester" },
      secondaryCta: { text: "Bli medlem i On Poynt", url: "/on-poynt" },
    },
  ],
};

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: "pages",
  where: { slug: { equals: page.slug } },
  limit: 1,
  depth: 0,
});

if (existing.docs.length > 0) {
  await payload.update({
    collection: "pages",
    id: existing.docs[0].id,
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info(`Oppdaterte side: /${page.slug}`);
} else {
  await payload.create({
    collection: "pages",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info(`Opprettet side: /${page.slug}`);
}

payload.logger.info("Ferdig med å seede /om.");
process.exit(0);
