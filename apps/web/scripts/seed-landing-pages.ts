/**
 * Seeder de to målgruppe-landingssidene (/for-grundere og /for-bedrifter) som
 * publiserte CMS-sider. Idempotent: oppdaterer layouten hvis siden finnes,
 * ellers opprettes den. Teksten er norsk plassholder — finpuss i admin.
 *
 *   bun run --cwd apps/web payload run scripts/seed-landing-pages.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });

// Slå opp tjeneste-ID-er på slug, så vi kan kuratere manuelt utvalg per side.
const allServices = await payload.find({
  collection: "services",
  limit: 100,
  depth: 0,
});
const serviceIdBySlug = new Map(allServices.docs.map((s) => [s.slug, s.id]));
const pickServices = (slugs: string[]) =>
  slugs
    .map((slug) => serviceIdBySlug.get(slug))
    .filter((id): id is NonNullable<typeof id> => id != null);

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
          "Susanne Todnem har ti år som selvstendig, bakgrunn fra bank, IT og fintech – blant annet PayPal – og flere styreverv i stiftelser og kommersielle AS. Hun bidrar som styremedlem, rådgiver og foredragsholder.",
        tagsLabel: "Jeg tilbyr:",
        tags: [
          { label: "Styreverv" },
          { label: "Strategisk rådgivning" },
          { label: "Foredrag" },
        ],
        primaryCta: { text: "Ta kontakt", url: "/kontakt" },
        secondaryCta: { text: "Se tjenester", url: "/tjenester" },
      },
      {
        blockType: "statsBand",
        eyebrow: "Bakgrunn",
        title: "Erfaring dere kan lene dere på",
        variant: "primary",
        stats: [
          { value: 10, suffix: " år", label: "som selvstendig" },
          { value: 5, label: "egne bedrifter startet" },
          { value: 9, suffix: "+", label: "merkevarer jobbet med" },
        ],
      },
      {
        // blockName → #styre: menyens «Styre & rådgivning» lenker hit.
        blockName: "styre",
        blockType: "featureGrid",
        eyebrow: "Styre & rådgivning",
        title: "Et styremedlem som ser både tall og mennesker",
        columns: "3",
        features: [
          {
            title: "Aktivt styrearbeid",
            text: "Flere styreverv i stiftelser og kommersielle AS. Aktiv deltakelse med blikk for forretning, vekst og menneskene bak.",
          },
          {
            title: "Strategisk rådgivning",
            text: "Sparring på posisjonering, vekst og gjennomføring – fra strategi til konkrete tiltak. Kunder fra børsnoterte selskap til to ansatte.",
          },
          {
            title: "Gründer- og investorblikk",
            text: "Har startet fem bedrifter selv og investert i lokale oppstartsselskap. Vet hvordan det er å stå i det.",
            linkLabel: "Ta en prat",
            linkUrl: "/kontakt",
          },
        ],
      },
      {
        // blockName → #foredrag: menyens «Foredrag» lenker hit.
        blockName: "foredrag",
        blockType: "featureGrid",
        eyebrow: "Foredrag & workshop",
        title: "Foredrag som gir energi – og noe å gå hjem med",
        columns: "3",
        features: [
          {
            title: "AI for bedrifter",
            text: "Det mest etterspurte temaet – praktisk og jordnært om hvordan AI gir reell vekst i arbeidshverdagen.",
          },
          {
            title: "LinkedIn i praksis",
            text: "Holdt på Social Media Days og i næringsforeninger over hele landet. Konkret om synlighet og posisjonering.",
          },
          {
            title: "Workshop for team og styre",
            text: "Skreddersydde samlinger for ledergrupper, team og styrer.",
            linkLabel: "Book et foredrag",
            linkUrl: "/kontakt",
          },
        ],
      },
      {
        blockType: "servicesArchive",
        title: "Tjenester",
        description: "Et utvalg av hva jeg kan bidra med.",
        selectionMode: "manual",
        selectedServices: pickServices([
          "workshop-for-styret",
          "kurs-og-foredrag",
          "radgiving",
        ]),
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
