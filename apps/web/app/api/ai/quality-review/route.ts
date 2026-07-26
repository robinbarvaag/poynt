import {
  serializeBlogPostContent,
  serializeCaseStudyContent,
  serializePageContent,
  serializeServiceContent,
} from "@/lib/quality-review-content";
import {
  hashGuideContent,
  serializeGuideContent,
} from "@/lib/serialize-guide-content";
import { TONE_OF_VOICE } from "@/lib/tone-of-voice";
import type {
  BlogPost,
  CaseStudy,
  Guide,
  Page,
  Service,
} from "@/payload-types";
import config from "@/payload.config";
import { Output, gateway, streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";

/**
 * Redaktør-assistent for ALT innhold: guider, sider og blogginnlegg. Leser
 * dokumentets innhold og gir en rubrikk-basert kvalitetsvurdering: én
 * totalscore (0–100), delscore per dimensjon med begrunnelse, og de viktigste
 * konkrete fiksene. Dimensjonene er ULIKE per innholdstype (en salgsside og en
 * guide måles ikke likt), men «Merkevare og tone» går igjen overalt og måler
 * mot Poynts faktiske tone of voice (lib/tone-of-voice.ts ↔ docs/TONE-OF-VOICE.md).
 * KUN diagnose – den skriver ikke om innholdet (det er partnerens jobb).
 * Brukes av «Vurder kvalitet»-knappen i admin (quality-review-button.tsx).
 * Generalisering av den gamle /api/ai/guide-review-ruta.
 */

const reviewModel = gateway("anthropic/claude-sonnet-4-6");

interface Dimension {
  key: string;
  label: string;
  spm: string;
}

const TONE_DIMENSION: Dimension = {
  key: "tone",
  label: "Merkevare og tone",
  spm: "Følger språket Poynts tone of voice (gjengitt i systeminstruksen)? Jeg/du-form, konkret framfor stort, bokmål, «AI» ikke «KI», ingen svada.",
};

interface CollectionReviewConfig {
  label: string;
  rolle: string;
  dimensions: Dimension[];
  serialize: (doc: unknown) => string;
  kontekst?: (doc: unknown) => string | null;
}

const GUIDE_DIMENSIONS: Dimension[] = [
  {
    key: "struktur",
    label: "Klarhet og struktur",
    spm: "Har innholdet tydelig hierarki og rekkefølge, eller er det en flat liste/dump? Leder overskriftene leseren gjennom et løp?",
  },
  {
    key: "handlingsbarhet",
    label: "Handlingsbarhet",
    spm: "Vet leseren konkret hva de skal gjøre, og i hvilken rekkefølge? Er det et tydelig neste steg?",
  },
  {
    key: "maalgruppe",
    label: "Målgruppe-fokus",
    spm: "Er nivået konsistent, eller blandes nybegynner- og viderekommen-stoff om hverandre? Er det klart hvem dette er for?",
  },
  {
    key: "holdbarhet",
    label: "Holdbarhet",
    spm: "Hvor fort råtner dette? Mange verktøynavn, priser eller lenker som endrer seg raskt trekker ned. Tidløse prinsipper trekker opp.",
  },
  {
    key: "egenverdi",
    label: "Egenverdi vs. lenke-dump",
    spm: "Tilfører teksten egen innsikt og kontekst (hvorfor/når), eller peker den bare videre til andre ressurser uten å si noe selv?",
  },
  TONE_DIMENSION,
];

const PAGE_DIMENSIONS: Dimension[] = [
  {
    key: "budskap",
    label: "Budskap og løfte",
    spm: "Forstår en besøkende på fem sekunder hva siden tilbyr, hvem det er for og hvorfor det er verdt noe? Er løftet konkret eller generisk?",
  },
  {
    key: "struktur",
    label: "Struktur og hierarki",
    spm: "Bygger seksjonene en logisk fortelling (problem → løsning → bevis → handling)? Har overskriftene riktig nivå og setningsform? Husk husreglene: hero øverst, venstrestilte seksjonstitler, maks to fargepaneler, nyhetsbrev sist.",
  },
  {
    key: "variasjon",
    label: "Rytme og virkemidler",
    spm: "Veksler siden mellom tekst, tall, bilder, sitater og kort — eller er det en monoton vegg av like seksjoner? Brukes virkemidlene (tall-bånd, kundeomtaler, logo-stripe) der de faktisk underbygger budskapet?",
  },
  {
    key: "bilder",
    label: "Bilde- og mediebruk",
    spm: "Har siden nok bilder/medier til å bære innholdet visuelt, og har de alt-tekst? Merkede hull ([Mangler …], seksjoner helt uten medier) trekker ned.",
  },
  {
    key: "konvertering",
    label: "Neste steg",
    spm: "Er det ETT tydelig hovedmål (CTA) med muntlig, konkret knappetekst? Konkurrerer flere like knapper om oppmerksomheten?",
  },
  TONE_DIMENSION,
];

const BLOG_DIMENSIONS: Dimension[] = [
  {
    key: "krok",
    label: "Tittel og krok",
    spm: "Får tittel og ingress leseren til å ville lese videre – og lover de noe teksten faktisk holder? «I denne artikkelen skal vi se på …»-åpninger trekker ned.",
  },
  {
    key: "struktur",
    label: "Struktur og skumlesbarhet",
    spm: "Kan en travel leser skumme overskriftene og fortsatt få poenget? Er avsnittene korte, og brukes mellomtitler/lister der det hjelper?",
  },
  {
    key: "egenverdi",
    label: "Egen innsikt",
    spm: "Sier teksten noe eget – erfaring, mening, konkrete eksempler – eller kunne den stått på hvilken som helst blogg?",
  },
  {
    key: "sokbarhet",
    label: "Søk og AI-synlighet",
    spm: "Svarer teksten på et spørsmål folk faktisk stiller (søk/AI-assistenter)? Er tittelen søkbar, og finnes det et sitérbart hovedpoeng tidlig?",
  },
  {
    key: "bilder",
    label: "Bildebruk",
    spm: "Har innlegget hovedbilde, og brytes lange tekstpartier opp med bilder/illustrasjoner der det trengs? Mangler ([Mangler hovedbilde]) trekker ned.",
  },
  TONE_DIMENSION,
];

const CASE_STUDY_DIMENSIONS: Dimension[] = [
  {
    key: "bue",
    label: "Historie-bue",
    spm: "Følger historien løpet utfordring → hva vi gjorde → resultat, og er alle tre delene faktisk til stede? En historie uten tydelig «før» eller uten resultat trekker ned.",
  },
  {
    key: "bevis",
    label: "Konkretisering og bevis",
    spm: "Er grepene og resultatene konkrete (tall, kanaler, tidsrom), eller generelle («økt synlighet», «bedre resultater»)? [Resultater i tall] og spesifikke detaljer trekker opp.",
  },
  {
    key: "troverdighet",
    label: "Troverdighet",
    spm: "Høres dette ut som en ekte historie med ekte detaljer (navn, sitat, gjenkjennelig hverdag), eller som en reklametekst? Kundesitat med navn styrker.",
  },
  {
    key: "bilder",
    label: "Bildebruk",
    spm: "Har historien et ekte hovedbilde av kunden/bedriften? [Mangler hovedbilde] eller generisk stock trekker ned.",
  },
  TONE_DIMENSION,
];

const SERVICE_DIMENSIONS: Dimension[] = [
  {
    key: "verdiloefte",
    label: "Verdiløfte",
    spm: "Forstår en potensiell kunde raskt hva de får, hvem tjenesten er for og hva som er utfallet? «Vi hjelper med synlighet»-formuleringer trekker ned, konkrete leveranser trekker opp.",
  },
  {
    key: "innhold",
    label: "Hva er inkludert",
    spm: "Sier den detaljerte beskrivelsen konkret hva som inngår, hvordan det foregår og hva kunden sitter igjen med — eller er den tynn/tom? [Ingen detaljert beskrivelse] trekker tydelig ned.",
  },
  {
    key: "pris",
    label: "Pris og forventninger",
    spm: "Henger prisen og beskrivelsen sammen — skjønner kunden hva prisen dekker? Ved «ta kontakt for pris»: er det tydelig hva en prat innebærer?",
  },
  {
    key: "tillit",
    label: "Tillit og bevis",
    spm: "Er det noe som bygger tillit — konkrete eksempler, resultater, FAQ som svarer på reelle innvendinger? Generiske påstander uten belegg trekker ned.",
  },
  {
    key: "bilder",
    label: "Bildebruk",
    spm: "Har tjenesten et bilde med alt-tekst som støtter innholdet? [Mangler bilde] trekker ned.",
  },
  TONE_DIMENSION,
];

const CONFIGS: Record<string, CollectionReviewConfig> = {
  guides: {
    label: "ressurs/guide",
    rolle:
      "Du vurderer en medlems-guide i On Poynt. Vær konkret og litt streng – en flat lenke-liste uten egen innsikt skal IKKE score høyt selv om lenkene er nyttige.",
    dimensions: GUIDE_DIMENSIONS,
    serialize: (doc) => serializeGuideContent(doc as Guide),
    kontekst: (doc) => `Seksjon: ${(doc as Guide).section}`,
  },
  pages: {
    label: "nettside (blokk-bygget)",
    rolle:
      "Du vurderer en offentlig side på poynt.no, bygget av seksjoner/blokker. [Seksjon N: …]-merkene viser blokktype, [oppsett: …] viser layoutvalg, [Knapp …] viser CTA-er og [Bilde/medie …] viser bildebruk. Vurder siden som helhet – budskap, komposisjon og konvertering – ikke bare prosaen.",
    dimensions: PAGE_DIMENSIONS,
    serialize: (doc) => serializePageContent(doc as Page),
    kontekst: (doc) => {
      const slug = (doc as Page).slug;
      return slug ? `URL: /${slug === "forside" ? "" : slug}` : null;
    },
  },
  "case-studies": {
    label: "kundehistorie",
    rolle:
      "Du vurderer en kundehistorie på poynt.no — tidløst salgsbevis, ikke fagstoff. Leseren er en potensiell kunde som lurer på om dette kan funke for dem: historien skal være konkret, troverdig og vise et faktisk resultat.",
    dimensions: CASE_STUDY_DIMENSIONS,
    serialize: (doc) => serializeCaseStudyContent(doc as CaseStudy),
  },
  "blog-posts": {
    label: "blogginnlegg",
    rolle:
      "Du vurderer et offentlig blogginnlegg på poynt.no. Leseren er en travel småbedriftseier som skummer – og innlegget skal også kunne bli funnet og sitert av søkemotorer og AI-assistenter.",
    dimensions: BLOG_DIMENSIONS,
    serialize: (doc) => serializeBlogPostContent(doc as BlogPost),
  },
  services: {
    label: "tjenesteside",
    rolle:
      "Du vurderer en tjenesteside på poynt.no — en salgsside for én konkret tjeneste. Leseren er en småbedriftseier som lurer på om dette er verdt pengene: siden skal gjøre det lett å forstå hva en får, hva det koster og hva neste steg er.",
    dimensions: SERVICE_DIMENSIONS,
    serialize: (doc) => serializeServiceContent(doc as Service),
  },
};

const reviewSchema = z.object({
  totalScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Samlet nytteverdi-score 0–100. Vær ærlig og kalibrert."),
  oppsummering: z
    .string()
    .describe("Én til to setninger: hovedinntrykket av innholdet."),
  dimensjoner: z
    .array(
      z.object({
        key: z.string().describe("Dimensjons-nøkkelen den vurderer."),
        score: z.number().min(0).max(100),
        begrunnelse: z
          .string()
          .describe("Kort, konkret begrunnelse for delscoren."),
      })
    )
    .describe("Én vurdering per dimensjon, i samme rekkefølge som oppgitt."),
  toppFiks: z
    .array(
      z.object({
        tittel: z.string().describe("Kort overskrift for fiksen."),
        beskrivelse: z
          .string()
          .describe(
            "Konkret hva som bør gjøres – ikke skriv om teksten, bare beskriv grepet."
          ),
      })
    )
    .min(1)
    .max(5)
    .describe(
      "De viktigste, mest konkrete forbedringene – sortert etter effekt."
    ),
});

function buildSystem(cfg: CollectionReviewConfig): string {
  return `Du er en erfaren norsk innholdsredaktør for Poynt, en tjeneste som hjelper små bedrifter med markedsføring, innhold og AI.

${cfg.rolle}

Du gir en ærlig, kalibrert nytteverdi-score fra 0 til 100.

Kalibrering:
- 0–39: trenger omarbeiding – flat dump, uklart hvem det er for, lite egen verdi.
- 40–69: brukbart, men har tydelige svakheter (struktur, nivå, virkemidler).
- 70–84: godt – tydelig, handlingsbart, egen stemme.
- 85–100: utmerket – ville stått som flaggskip-innhold.

${TONE_OF_VOICE}

Du skal KUN diagnostisere. Ikke skriv om innholdet og ikke produser ferdig erstatningstekst. Gi i stedet konkrete grep partneren selv kan gjøre.

Svar på norsk bokmål.`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      collection?: string;
      id?: string | number;
    };
    const cfg = body.collection ? CONFIGS[body.collection] : undefined;
    if (!cfg || body.id === undefined || body.id === null) {
      return NextResponse.json(
        {
          error:
            "Mangler collection/id (guides, pages, blog-posts, case-studies eller services).",
        },
        { status: 400 }
      );
    }

    const doc = await payload
      .findByID({
        collection: body.collection as
          | "guides"
          | "pages"
          | "blog-posts"
          | "case-studies"
          | "services",
        id: body.id,
        depth: 1,
        draft: true,
      })
      .catch(() => null);

    if (!doc) {
      return NextResponse.json(
        { error: "Fant ikke dokumentet." },
        { status: 404 }
      );
    }

    const serialized = cfg.serialize(doc);
    if (serialized.trim().length < 40) {
      return NextResponse.json(
        { error: "For lite innhold til å vurdere – skriv litt mer først." },
        { status: 400 }
      );
    }

    const dimensjonsListe = cfg.dimensions
      .map((d) => `- ${d.key} (${d.label}): ${d.spm}`)
      .join("\n");
    const kontekst = cfg.kontekst?.(doc);

    const result = streamText({
      model: reviewModel,
      output: Output.object({ schema: reviewSchema }),
      system: buildSystem(cfg),
      prompt: `Vurder denne ${cfg.label}-en. Gi delscore for HVER av disse dimensjonene (bruk nøkkelen som "key"):

${dimensjonsListe}
${kontekst ? `\n${kontekst}\n` : ""}
Innhold:
"""
${serialized}
"""`,
    });

    const review = await result.output;

    // Map dimensjons-nøkler til lesbare etiketter for frontend.
    const labelByKey = new Map(cfg.dimensions.map((d) => [d.key, d.label]));
    const dimensjoner = review.dimensjoner.map((d) => ({
      ...d,
      label: labelByKey.get(d.key) ?? d.key,
    }));

    // Hash av innholdet vi faktisk vurderte → lagres med scoren så radaren
    // (og panelet) kan se om innholdet er endret siden vurderingen.
    const contentHash = hashGuideContent(serialized);

    return NextResponse.json({ ...review, dimensjoner, contentHash });
  } catch (error) {
    console.error("Quality review error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kunne ikke vurdere innholdet akkurat nå.",
      },
      { status: 500 }
    );
  }
}
