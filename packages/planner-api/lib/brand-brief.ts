import {
  type BrandBriefStream,
  brandBriefStreamSchema,
} from "@poynt/planner-validators";
import { type DeepPartial, Output, streamText } from "ai";
import { flagshipModel } from "./models";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Scraper en nettside via Firecrawl og returnerer markdown-innholdet. Kaster
 * med en klar, bruker-vennlig feilmelding hvis API-nøkkelen mangler eller
 * scrapingen feiler — så UI-et kan tilby «lim inn tekst i stedet».
 */
export async function scrapeWebsite(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Nettside-henting er ikke konfigurert (mangler FIRECRAWL_API_KEY). Lim inn tekst om bedriften i stedet."
    );
  }

  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Klarte ikke hente nettsiden (Firecrawl svarte ${res.status}). Sjekk URL-en, eller lim inn tekst i stedet.`
    );
  }

  const json = (await res.json()) as {
    success?: boolean;
    data?: { markdown?: string };
  };
  const markdown = json?.data?.markdown?.trim();
  if (!json?.success || !markdown) {
    throw new Error(
      "Fant ikke noe innhold på nettsiden. Prøv en annen side, eller lim inn tekst i stedet."
    );
  }
  return markdown;
}

/**
 * Streamer en merkevarebrief fra nettside-innhold (eller innlimt tekst) via det
 * stabile `streamText` + `Output.object`-API-et. Returnerer `partialOutputStream`
 * (progressive delobjekter) og `output` (ferdig, validert objekt).
 */
export async function streamBrandBrief({
  content,
  businessName,
}: {
  content: string;
  businessName?: string;
}): Promise<{
  partialOutputStream: AsyncIterable<DeepPartial<BrandBriefStream>>;
  output: PromiseLike<BrandBriefStream>;
}> {
  const system = await resolveSystemPrompt("brand-brief-system");

  const prompt = `${businessName ? `Bedrift: ${businessName}\n\n` : ""}Innhold fra bedriftens nettside / kilde:
"""
${content.slice(0, 16000)}
"""

Analyser innholdet grundig og lag en presis, spesifikk merkevarebrief på norsk (bokmål). Unngå generiske formuleringer — bruk det som faktisk står i kilden.`;

  const result = streamText({
    model: flagshipModel,
    system,
    prompt,
    output: Output.object({ schema: brandBriefStreamSchema }),
  });

  return {
    partialOutputStream: result.partialOutputStream,
    output: result.output,
  };
}
