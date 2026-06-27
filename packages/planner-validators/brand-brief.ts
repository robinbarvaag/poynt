import { z } from "zod";

/**
 * Merkevarebrief — «felles hjerne 2.0». En rik, strukturert beskrivelse av
 * bedriftens stemme og posisjon, generert (typisk fra nettsiden deres) og
 * deretter redigerbar. Lagres på workspace-profilen og injiseres i ALLE
 * AI-verktøyene, så de skriver i bedriftens faktiske stemme.
 *
 * Lagret variant er lenient (alle felter valgfrie) så delvis utfylling/lagring
 * og redigering er trygt.
 */
export const brandBriefSchema = z.object({
  toneOfVoice: z.string().nullable().optional(),
  phrasesWeUse: z.array(z.string()).nullable().optional(),
  phrasesWeAvoid: z.array(z.string()).nullable().optional(),
  coreMessage: z.string().nullable().optional(),
  usp: z.string().nullable().optional(),
  /** Hvem målgruppen er + smertepunkter og ønsker — driver gode caption-hooks. */
  audienceInsight: z.string().nullable().optional(),
  visualStyle: z.string().nullable().optional(),
  /** Hvilken nettside briefen ble generert fra (for sporbarhet i UI-et). */
  sourceUrl: z.string().nullable().optional(),
});

export type BrandBrief = z.infer<typeof brandBriefSchema>;

/**
 * Skjema for det AI-en streamer (via `streamText` + `Output.object`). Strengt:
 * OpenAIs structured-output krever alle felter i `required` → valgfrie felter
 * må være `.nullable()`. Felt-rekkefølgen er bevisst = visuell topp→bunn.
 */
export const brandBriefStreamSchema = z.object({
  toneOfVoice: z.string(),
  phrasesWeUse: z.array(z.string()),
  phrasesWeAvoid: z.array(z.string()),
  coreMessage: z.string(),
  usp: z.string(),
  audienceInsight: z.string(),
  visualStyle: z.string().nullable(),
});

export type BrandBriefStream = z.infer<typeof brandBriefStreamSchema>;

/**
 * Input til brief-generering: enten en nettside-URL (scrapes server-side via
 * Firecrawl) eller innlimt tekst som fallback. `businessName` er valgfri hjelp.
 */
export const brandBriefRequestSchema = z
  .object({
    url: z
      .string()
      .url("Skriv inn en gyldig URL (f.eks. https://bedriften.no)")
      .optional()
      .or(z.literal("")),
    pastedText: z
      .string()
      .max(20000, "Maks 20 000 tegn")
      .optional()
      .or(z.literal("")),
    businessName: z.string().max(200).optional().or(z.literal("")),
  })
  .refine((d) => Boolean(d.url) || Boolean(d.pastedText), {
    message: "Oppgi en nettside-URL eller lim inn tekst om bedriften",
  });

export type BrandBriefRequest = z.infer<typeof brandBriefRequestSchema>;
