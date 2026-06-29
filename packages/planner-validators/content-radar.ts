import { z } from "zod";

/**
 * Innholdsradar — typer som deles mellom signal-innsamlingen (apps/web) og
 * AI-syntesen (planner-api). Se docs/CONTENT-RADAR.md.
 */

/** Type forslag radaren produserer. Speiler `ContentSuggestionType` i planner-db. */
export const contentSuggestionTypes = [
  "create",
  "refresh",
  "promote",
  "repurpose",
] as const;
export type ContentSuggestionTypeValue =
  (typeof contentSuggestionTypes)[number];

export const contentSuggestionTypeLabels: Record<
  ContentSuggestionTypeValue,
  string
> = {
  create: "Lag nytt",
  refresh: "Oppdater",
  promote: "Promoter",
  repurpose: "Gjenbruk",
};

/** Hva slags signal som ligger bak. Kun beskrivende — driver fortelling, ikke logikk. */
export const radarSignalKinds = [
  "stale",
  "stuck_draft",
  "coverage_gap",
  "featured_rotation",
  "demand",
  "inspiration_gap",
  "popular",
  "low_quality",
] as const;
export type RadarSignalKind = (typeof radarSignalKinds)[number];

/** Typer eksterne inspirasjonskilder partneren kan registrere. Kun offentlige feeds. */
export const inspirationSourceTypes = ["website", "rss"] as const;
export type InspirationSourceTypeValue =
  (typeof inspirationSourceTypes)[number];

export const inspirationSourceTypeLabels: Record<
  InspirationSourceTypeValue,
  string
> = {
  website: "Nettside",
  rss: "RSS-feed",
};

/**
 * Ett deterministisk signal beregnet i kode og matet inn til AI-en. `key` er
 * stabil mellom kjøringer, så den brukes både som dedup-anker og til å koble
 * AI-forslaget tilbake til riktig prioritet/evidens.
 */
export interface RadarSignalInput {
  key: string;
  kind: RadarSignalKind;
  /** Menneskelesbar setning AI-en resonnerer ut fra. */
  summary: string;
  /** Deterministisk prioritet 0–100 (settes av koden, ikke AI-en). */
  priority: number;
  targetCollection: string | null;
  targetId: string | null;
  category: string | null;
}

/**
 * Det AI-en returnerer per forslag. OpenAIs strenge structured-output krever at
 * ALLE felter er påkrevd — valgfrie felter er derfor `.nullable()`, ikke
 * `.optional()`. `signalKey` MÅ være en av nøklene vi matet inn, så koden kan
 * slå opp deterministisk prioritet og evidens.
 */
const generatedSuggestionSchema = z.object({
  type: z.enum(contentSuggestionTypes),
  title: z.string(),
  rationale: z.string(),
  signalKey: z.string(),
  targetCollection: z.string().nullable(),
  targetId: z.string().nullable(),
  category: z.string().nullable(),
});

export const contentRadarOutputSchema = z.object({
  suggestions: z.array(generatedSuggestionSchema),
});

export type GeneratedSuggestion = z.infer<typeof generatedSuggestionSchema>;
export type ContentRadarOutput = z.infer<typeof contentRadarOutputSchema>;

/**
 * Det inspirasjons-destilleringen returnerer: relevante, offentlige saker gjort
 * om til korte, tema-taggede notater. `url` er nullable fordi nettside-scraping
 * ofte bare har én side-URL, mens RSS gir per-sak-lenker. Strenge OpenAI-felter
 * → nullable, ikke optional.
 */
const inspirationItemSchema = z.object({
  title: z.string(),
  url: z.string().nullable(),
  topics: z.array(z.string()),
  summary: z.string(),
});

export const inspirationDistillOutputSchema = z.object({
  items: z.array(inspirationItemSchema),
});

export type DistilledInspirationItem = z.infer<typeof inspirationItemSchema>;
export type InspirationDistillOutput = z.infer<
  typeof inspirationDistillOutputSchema
>;
