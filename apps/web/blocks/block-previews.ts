/**
 * Forhåndsvisningsbilder i blokkvelgeren.
 *
 * Payload viser `imageURL` som miniatyrbilde på hvert kort i «Legg til blokk»-
 * skuffen, så partneren ser hvordan blokken faktisk ser ut før den legges til.
 *
 * Bildene er ikke håndlagde: de skytes fra Storybook av
 * `apps/storybook/scripts/capture-block-previews.ts`, som leser denne fila for å
 * vite hvilken story som hører til hvilken blokk. Kjør `bun run block-previews`
 * fra rota etter at en story eller komponent er endret.
 *
 * Blokker som ikke står her (Innholdsblokk, Media, CTA-er uten story, Skjema,
 * Spotify) får ingen `imageURL` — kortet vises da med bare navn, som før.
 */
export interface BlockPreview {
  /** Storybook-tittelen (`meta.title`). Første story under tittelen skytes. */
  story: string;
  /** Alt-tekst på miniatyrbildet i blokkvelgeren. */
  alt: string;
}

export const blockPreviews: Record<string, BlockPreview> = {
  hero: {
    story: "Blokker/Hero",
    alt: "Stor intro-seksjon med bilde og knapper",
  },
  bookHero: {
    story: "Blokker/BookHero",
    alt: "Hero med tekst til venstre og et kort som blar gjennom kapitler til høyre",
  },
  featureGrid: {
    story: "Blokker/FeatureGrid",
    alt: "Rutenett med fargede kort som fremhever tilbud",
  },
  steps: { story: "Blokker/Steps", alt: "Nummererte steg på rad" },
  contentMedia: {
    story: "Blokker/ContentMedia",
    alt: "Tekst ved siden av et bilde",
  },
  statsBand: {
    story: "Blokker/StatsBand",
    alt: "Farget bånd med nøkkeltall som teller opp",
  },
  pricing: { story: "Blokker/Pricing", alt: "Priskort side om side" },
  faq: { story: "Blokker/Faq", alt: "Spørsmål som folder seg ut" },
  logoCloud: { story: "Blokker/LogoCloud", alt: "Stripe med kundelogoer" },
  newsletter: {
    story: "Blokker/Newsletter",
    alt: "Panel med e-postfelt for nyhetsbrev",
  },
  pathCards: {
    story: "Blokker/PathCards",
    alt: "To store valgkort som sender leseren videre",
  },
  carousel: {
    story: "Blokker/Karusell",
    alt: "Karusell med kort som kan dras sidelengs",
  },
  testimonials: {
    story: "Blokker/Testimonials",
    alt: "Kundesitater med navn og vurdering",
  },
  ctaSection: {
    story: "Blokker/CtaSection",
    alt: "Grønt panel med overskrift og handlingsknapper",
  },
  productArchive: {
    story: "Blokker/ProductGrid",
    alt: "Rutenett med produktkort",
  },
  productSpotlight: {
    story: "Blokker/ProductSpotlight",
    alt: "Ett produkt liggende med bilde, pris og kjøpsknapp",
  },
  podcastArchive: {
    story: "Blokker/PodcastGrid",
    alt: "Rutenett med podkast-episoder",
  },
  servicesArchive: {
    story: "Blokker/ServiceShowcase",
    alt: "Tjenester presentert som kort",
  },
  resourceList: {
    story: "Blokker/ResourceList",
    alt: "Kort med lenker, bøker og filer, med filter-brikker over",
  },
  promptLibrary: {
    story: "Blokker/PromptLibrary",
    alt: "Prompter i kort med kopier-knapp",
  },
  // Verdifull vekst
  chapterPortal: {
    story: "Vekst/Kapittelportalen",
    alt: "Fem buede dører med bokstavene V, E, K, S og T",
  },
  vekstCheck: {
    story: "Vekst/VEKST-sjekken",
    alt: "Bokstavklosser som fylles opp, med et ja/nei-spørsmål under",
  },
  changeWheel: {
    story: "Vekst/Endringshjulet",
    alt: "Et hjul med fire områder og ja/nei-spørsmål ved siden av",
  },
  growthCalculator: {
    story: "Vekst/Kalkulator",
    alt: "Kalkulator med en måler i rosa, gult og grønt",
  },
  mythCards: {
    story: "Vekst/Ti løgner",
    alt: "Vendekort med stempelet «Løgn» og en teller over",
  },
  aiWorkflow: {
    story: "Vekst/Arbeidsflyter med KI",
    alt: "Tre bokser koblet sammen: input, prompt og resultat",
  },
  salesRitual: {
    story: "Vekst/Omsetnings-onsdag",
    alt: "Kalenderblad for onsdag ved siden av en sjekkliste",
  },
};

/** Public-stien bildet havner på, eller `undefined` når blokken ikke har story. */
export function blockPreviewUrl(slug: string): string | undefined {
  return blockPreviews[slug] ? `/block-previews/${slug}.jpg` : undefined;
}
