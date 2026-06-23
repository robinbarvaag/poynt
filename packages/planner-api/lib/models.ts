import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Sentral modell-konfig for AI-verktøyene. Alle kall går via disse, så
 * provider/modell byttes ÉN plass.
 *
 * Bytte til Claude senere (når en nøkkel er på plass) er en ett-linjes endring:
 *   - Via Vercel AI Gateway (allerede installert som `@ai-sdk/gateway`):
 *       import { gateway } from "ai";
 *       export const flagshipModel = gateway("anthropic/claude-sonnet-4-6");
 *     (krever AI_GATEWAY_API_KEY, eller OIDC ved kjøring på Vercel)
 *   - Eller med direkte provider:
 *       bun add @ai-sdk/anthropic  +  sett ANTHROPIC_API_KEY
 *       import { anthropic } from "@ai-sdk/anthropic";
 *       export const flagshipModel = anthropic("claude-sonnet-4-6");
 *
 * Inntil da bruker vi OpenAI direkte med den eksisterende OPENAI_API_KEY.
 * `gpt-4o` gir merkbart bedre norsk/tone enn `gpt-4o-mini` på flaggskip-
 * verktøyene, og koster det samme oppsettet (samme nøkkel).
 */

/** Flaggskip-verktøy (kanalveileder, markedsplan, årshjul) — kvalitet først. */
export const flagshipModel: LanguageModel = openai("gpt-4o");

/** Lette/hurtige verktøy (avslå-generator, podkast-gjenbruk) — billig og rask. */
export const utilityModel: LanguageModel = openai("gpt-4o-mini");
