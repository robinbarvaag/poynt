import { gateway } from "ai";
import type { LanguageModel } from "ai";

/**
 * Sentral modell-konfig for AI-verktøyene. Alle kall går via disse, så
 * provider/modell byttes ÉN plass.
 *
 * Vi går via **Vercel AI Gateway** (`gateway(...)` fra `ai`): modeller velges
 * som strenger på formen `"<provider>/<modell>"`, og ALLE leverandører nås med
 * én `AI_GATEWAY_API_KEY` (eller OIDC ved kjøring på Vercel). Å bytte modell —
 * eller legge til en helt ny leverandør — er da bare en strengendring; ingen
 * nye provider-pakker eller nøkler.
 *
 * Flaggskip-modellen ble byttet fra `openai/gpt-4o` til `anthropic/
 * claude-sonnet-4-6` (sterkere på nyansert norsk/tone). Sammenlign modeller på
 * dummy-data i Modell-laben (`/on-poynt/lab`) før du endrer dette valget.
 */

/** Flaggskip-verktøy (kanalveileder, markedsplan, årshjul) — kvalitet først. */
export const flagshipModel: LanguageModel = gateway(
  "anthropic/claude-sonnet-4-6"
);

/** Lette/hurtige verktøy (avslå-generator, podkast-gjenbruk) — billig og rask. */
export const utilityModel: LanguageModel = gateway("openai/gpt-4o-mini");

/**
 * Modell-registry for Modell-laben (`/on-poynt/lab`): kjør samme prompt mot
 * flere modeller og sammenlign output, latency og token-bruk. Siden vi går via
 * Gateway er hver «modell» bare en streng — legg til en ny rad for å gjøre en
 * modell tilgjengelig i laben (ingen install, ingen ny nøkkel).
 */
export const PLAYGROUND_MODELS = [
  {
    id: "anthropic/claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    priceUsdPerMtok: { input: 3, output: 15 },
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    priceUsdPerMtok: { input: 2.5, output: 10 },
  },
  {
    id: "anthropic/claude-opus-4-8",
    label: "Claude Opus 4.8",
    provider: "Anthropic",
    priceUsdPerMtok: { input: 5, output: 25 },
  },
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    priceUsdPerMtok: { input: 1, output: 5 },
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "OpenAI",
    priceUsdPerMtok: { input: 0.15, output: 0.6 },
  },
] as const satisfies readonly {
  id: string;
  label: string;
  provider: "OpenAI" | "Anthropic";
  /**
   * Omtrentlige listepriser (USD per 1M tokens) for et grovt kostnadsanslag i
   * laben. Endrer seg over tid og Gateway kan ha påslag — juster ved behov.
   */
  priceUsdPerMtok: { input: number; output: number };
}[];

export type PlaygroundModelId = (typeof PLAYGROUND_MODELS)[number]["id"];

/** Grov vekslingskurs USD→NOK for kostnadsanslaget i laben. */
export const USD_TO_NOK = 11;

/** Anslå kostnad (USD + NOK) for et kjør, ut fra token-bruk. */
export function estimatePlaygroundCost(
  modelId: string,
  tokens: { inputTokens?: number; outputTokens?: number }
): { usd: number; nok: number } | undefined {
  const model = PLAYGROUND_MODELS.find((m) => m.id === modelId);
  if (!model) return undefined;
  const inTok = tokens.inputTokens ?? 0;
  const outTok = tokens.outputTokens ?? 0;
  const usd =
    (inTok / 1_000_000) * model.priceUsdPerMtok.input +
    (outTok / 1_000_000) * model.priceUsdPerMtok.output;
  return { usd, nok: usd * USD_TO_NOK };
}

export function isPlaygroundModelId(id: string): id is PlaygroundModelId {
  return PLAYGROUND_MODELS.some((m) => m.id === id);
}

/** Bygger LanguageModel for en lab-modell-id via Gateway. */
export function getPlaygroundModel(id: PlaygroundModelId): LanguageModel {
  return gateway(id);
}
