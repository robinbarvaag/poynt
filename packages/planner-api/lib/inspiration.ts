import {
  type InspirationDistillOutput,
  inspirationDistillOutputSchema,
} from "@poynt/planner-validators";
import { Output, streamText } from "ai";
import { flagshipModel } from "./models";
import { resolveSystemPrompt } from "./prompt-template";

export { scrapeWebsite } from "./brand-brief";

/**
 * Inspirasjon — AI-destillering. Tar rå innhold fra en offentlig kilde (scrapet
 * nettside-markdown eller en liste RSS-saker) og destillerer det til korte,
 * tema-taggede notater som gap-analysen kan sammenligne mot On Poynts egne
 * kategorier. Se docs/CONTENT-RADAR.md.
 *
 * Prinsipp som ellers i radaren: AI eier FORTELLINGEN (hva som er verdt å merke
 * seg + emneord), koden eier resten (henting, dedup, gap-utregning).
 */
export async function distillInspiration({
  sourceLabel,
  content,
  ownCategories,
}: {
  /** Menneskelesbart navn på kilden, for kontekst i prompten. */
  sourceLabel: string;
  /** Rå tekst (markdown eller en formatert liste RSS-saker). */
  content: string;
  /** On Poynts egne kategorinavn, så AI-en vet hva som allerede er dekket. */
  ownCategories: string[];
}): Promise<InspirationDistillOutput> {
  const trimmed = content.trim();
  if (!trimmed) return { items: [] };

  const system = await resolveSystemPrompt("inspiration-distill-system");

  const categoryHint =
    ownCategories.length > 0
      ? `On Poynt dekker allerede disse kategoriene: ${ownCategories.join(", ")}. Vekt saker som tilfører noe NYTT eller en ny vinkling.`
      : "";

  const prompt = `Kilde: ${sourceLabel}

${categoryHint}

Innhold fra kilden:
"""
${trimmed.slice(0, 16000)}
"""

Destiller de relevante sakene for et norsk småbedrifts-publikum. Hopp over rent salgsinnhold og klikkagn. Sett "url" når en konkret sakslenke finnes i innholdet, ellers null.`;

  const result = streamText({
    model: flagshipModel,
    system,
    prompt,
    output: Output.object({ schema: inspirationDistillOutputSchema }),
  });

  return await result.output;
}
