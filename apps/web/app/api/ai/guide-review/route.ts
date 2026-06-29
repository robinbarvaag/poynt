import {
  hashGuideContent,
  serializeGuideContent,
} from "@/lib/serialize-guide-content";
import type { Guide } from "@/payload-types";
import config from "@/payload.config";
import { Output, gateway, streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";

/**
 * Redaktør-assistent for ressurser/guider. Leser en guides innhold og gir en
 * rubrikk-basert kvalitetsvurdering: én totalscore (0–100), delscore per
 * dimensjon med begrunnelse, og de viktigste konkrete fiksene. KUN diagnose –
 * den skriver ikke om innholdet for deg (det er partnerens jobb). Brukes av
 * «Vurder kvalitet»-knappen på Guider-dokumentet i admin.
 *
 * Følger samme oppsett som /api/ai/alt-text (Vercel AI Gateway + Payload-auth)
 * og samme strukturerte-output-mønster som on-poynt-verktøyene:
 * `streamText` + `Output.object`, så `await result.output`.
 */

const reviewModel = gateway("anthropic/claude-sonnet-4-6");

const DIMENSIONS = [
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
  {
    key: "tone",
    label: "Merkevare og tone",
    spm: "Stemmer språket med en varm, tydelig norsk fagstemme (On Poynt)? Bokmål, ikke svada, ikke tomt salgsspråk.",
  },
] as const;

const reviewSchema = z.object({
  totalScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Samlet nytteverdi-score 0–100. Vær ærlig og kalibrert."),
  oppsummering: z
    .string()
    .describe("Én til to setninger: hovedinntrykket av ressursen."),
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

const SYSTEM = `Du er en erfaren norsk innholdsredaktør for On Poynt, en tjeneste som hjelper små bedrifter med innhold, AI og synlighet.

Du vurderer kvaliteten på en ressurs/guide og gir en ærlig, kalibrert nytteverdi-score fra 0 til 100. Vær konkret og litt streng – en flat lenke-liste uten egen innsikt skal IKKE score høyt selv om lenkene er nyttige.

Kalibrering:
- 0–39: trenger omarbeiding – flat dump, uklart hvem det er for, lite egen verdi.
- 40–69: brukbart, men har tydelige svakheter (struktur, nivå, holdbarhet).
- 70–84: godt – tydelig, handlingsbart, egen stemme.
- 85–100: utmerket – ville stått som flaggskip-innhold.

Du skal KUN diagnostisere. Ikke skriv om innholdet og ikke produser ferdig erstatningstekst. Gi i stedet konkrete grep partneren selv kan gjøre.

Svar på norsk bokmål.`;

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      guideId?: string | number;
    };
    if (body.guideId === undefined || body.guideId === null) {
      return NextResponse.json({ error: "Mangler guideId." }, { status: 400 });
    }

    const guide = (await payload.findByID({
      collection: "guides",
      id: body.guideId,
      depth: 1,
      draft: true,
    })) as Guide | null;

    if (!guide) {
      return NextResponse.json({ error: "Fant ikke guiden." }, { status: 404 });
    }

    const markdown = serializeGuideContent(guide);
    if (markdown.trim().length < 40) {
      return NextResponse.json(
        { error: "For lite innhold til å vurdere – skriv litt mer først." },
        { status: 400 }
      );
    }

    const dimensjonsListe = DIMENSIONS.map(
      (d) => `- ${d.key} (${d.label}): ${d.spm}`
    ).join("\n");

    const result = streamText({
      model: reviewModel,
      output: Output.object({ schema: reviewSchema }),
      system: SYSTEM,
      prompt: `Vurder denne ressursen. Gi delscore for HVER av disse dimensjonene (bruk nøkkelen som "key"):

${dimensjonsListe}

Seksjon: ${guide.section}

Innhold:
"""
${markdown}
"""`,
    });

    const review = await result.output;

    // Map dimensjons-nøkler til lesbare etiketter for frontend.
    const labelByKey = new Map<string, string>(
      DIMENSIONS.map((d) => [d.key, d.label])
    );
    const dimensjoner = review.dimensjoner.map((d) => ({
      ...d,
      label: labelByKey.get(d.key) ?? d.key,
    }));

    // Hash av innholdet vi faktisk vurderte → lagres med scoren så radaren
    // (og panelet) kan se om innholdet er endret siden vurderingen.
    const contentHash = hashGuideContent(markdown);

    return NextResponse.json({ ...review, dimensjoner, contentHash });
  } catch (error) {
    console.error("Guide review error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kunne ikke vurdere guiden akkurat nå.",
      },
      { status: 500 }
    );
  }
}
