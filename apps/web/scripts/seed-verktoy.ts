/**
 * Seeder /verktoy — offentlig teaser av AI-verktøyene i On Poynt.
 * Idempotert: oppdaterer hvis siden finnes, ellers opprettes den.
 *
 *   bun run --cwd apps/web payload run scripts/seed-verktoy.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const page = {
  title: "Verktøy",
  slug: "verktoy",
  meta: {
    description:
      "Smarte AI-verktøy for markedsføring, planlegging og innhold – inkludert i On Poynt.",
  },
  layout: [
    {
      blockType: "hero",
      title: "Verktøy som gjør jobben lettere",
      subtitle:
        "Smarte AI-verktøy for markedsføring, planlegging og innhold – inkludert i On Poynt-medlemskapet.",
      tagsLabel: "Inkludert i On Poynt:",
      tags: [{ label: "AI" }, { label: "Markedsføring" }, { label: "Innhold" }],
      primaryCta: { text: "Bli medlem", url: "/on-poynt" },
      secondaryCta: { text: "Les om On Poynt", url: "/on-poynt" },
    },
    {
      blockType: "featureGrid",
      eyebrow: "Verktøykassa",
      title: "Dette får du tilgang til",
      columns: "3",
      features: [
        {
          title: "Årsplanlegger",
          text: "Planlegg hele markedsåret ditt – kampanjer, kanaler og innhold samlet på ett sted.",
        },
        {
          title: "Markedsplan",
          text: "Få en konkret og gjennomførbar markedsplan på minutter.",
        },
        {
          title: "Kanalveileder",
          text: "Finn ut hvilke kanaler som faktisk passer for din bedrift.",
        },
        {
          title: "Avslag-generator",
          text: "Skriv vennlige og profesjonelle avslag på sekunder.",
        },
        {
          title: "Podkast til innhold",
          text: "Gjør podkast-episoder om til innlegg, artikler og nyhetsbrev.",
        },
      ],
    },
    {
      blockType: "ctaSection",
      variant: "colored",
      title: "Få tilgang til alle verktøyene",
      description:
        "Verktøyene er inkludert i On Poynt-medlemskapet. Bli medlem og kom i gang i dag.",
      primaryCta: { text: "Bli medlem", url: "/on-poynt" },
      secondaryCta: { text: "Se produkter", url: "/produkter" },
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

payload.logger.info("Ferdig med å seede /verktoy.");
process.exit(0);
