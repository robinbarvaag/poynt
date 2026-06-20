/**
 * Seeder de to målgruppe-landingssidene (/for-grundere og /for-bedrifter) som
 * publiserte CMS-sider. Idempotent: oppdaterer layouten hvis siden finnes,
 * ellers opprettes den. Teksten er norsk plassholder — finpuss i admin.
 *
 *   bun run --cwd apps/web payload run scripts/seed-landing-pages.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const pages = [
  {
    title: "For gründere",
    slug: "for-grundere",
    excerpt:
      "Verktøy, kurs og fellesskap som hjelper deg å bygge og vokse — i ditt eget tempo.",
    layout: [
      {
        blockType: "hero",
        title: "Bygg det du drømmer om — med litt drahjelp",
        subtitle:
          "On Poynt gir deg verktøyene, kunnskapen og fellesskapet du trenger for å komme videre som selvstendig.",
        tagsLabel: "For deg som er:",
        tags: [
          { label: "Gründer" },
          { label: "Selvstendig" },
          { label: "Soloentreprenør" },
        ],
        primaryCta: { text: "Bli medlem i On Poynt", url: "/on-poynt" },
        secondaryCta: { text: "Se kurs og produkter", url: "/produkter" },
      },
      {
        blockType: "featureGrid",
        eyebrow: "Hva du får",
        title: "Alt du trenger for å komme videre",
        columns: "3",
        features: [
          {
            title: "AI-verktøy*",
            text: "Smarte verktøy som tar deg fra idé til ferdig innhold på minutter — årsplanlegger, markedsplan og mer.",
            linkLabel: "Utforsk verktøyene",
            linkUrl: "/verktoy",
          },
          {
            title: "Kurs og maler",
            text: "Praktiske kurs og ferdige maler laget for selvstendige som vil bygge smartere.",
            linkLabel: "Se produkter",
            linkUrl: "/produkter",
          },
          {
            title: "Fellesskap",
            text: "Et nettverk av andre gründere å sparre, dele og vokse sammen med.",
            statValue: "On Poynt",
            statLabel: "medlemskap",
          },
        ],
      },
      {
        blockType: "productArchive",
        title: "Utvalgte produkter",
        selectionMode: "auto",
        filterByType: "all",
        limit: 3,
        layout: "grid",
        showMoreLink: true,
      },
      {
        blockType: "ctaSection",
        variant: "colored",
        title: "Klar til å komme i gang?",
        description:
          "Bli medlem i On Poynt i dag og få tilgang til verktøy, kurs og fellesskap.",
        primaryCta: { text: "Bli medlem", url: "/on-poynt" },
        secondaryCta: { text: "Ta kontakt", url: "/kontakt" },
      },
    ],
  },
  {
    title: "For bedrifter",
    slug: "for-bedrifter",
    excerpt:
      "Hent inn kompetanse til styret, strategisk rådgivning eller foredrag — skreddersydd for dere.",
    layout: [
      {
        blockType: "hero",
        title: "Kompetanse til styret og ledelsen",
        subtitle:
          "Erfaring med både forretning og mennesker — som styremedlem, rådgiver eller foredragsholder.",
        tagsLabel: "Jeg tilbyr:",
        tags: [
          { label: "Styreverv" },
          { label: "Rådgivning" },
          { label: "Foredrag" },
        ],
        primaryCta: { text: "Ta kontakt", url: "/kontakt" },
        secondaryCta: { text: "Se tjenester", url: "/tjenester" },
      },
      {
        blockType: "featureGrid",
        eyebrow: "Slik kan jeg bidra",
        title: "Erfaring dere kan lene dere på",
        columns: "3",
        features: [
          {
            title: "Styrearbeid",
            text: "Aktiv styredeltakelse med blikk for både forretning, vekst og mennesker.",
          },
          {
            title: "Strategisk rådgivning",
            text: "Sparring og rådgivning for posisjonering, vekst og gjennomføring.",
          },
          {
            title: "Foredrag",
            text: "Inspirerende foredrag og workshops for team, ledergrupper og samlinger.",
          },
        ],
      },
      {
        blockType: "servicesArchive",
        title: "Tjenester",
        description: "Et utvalg av hva jeg kan bidra med.",
        layout: "grid",
        showMoreLink: true,
      },
      {
        blockType: "ctaSection",
        variant: "colored",
        title: "La oss ta en prat",
        description:
          "Ta kontakt for en uforpliktende samtale om hvordan jeg kan bidra hos dere.",
        primaryCta: { text: "Ta kontakt", url: "/kontakt" },
      },
    ],
  },
];

const payload = await getPayload({ config });

for (const page of pages) {
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
}

payload.logger.info("Ferdig med å seede landingssider.");
process.exit(0);
