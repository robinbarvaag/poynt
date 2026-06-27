import {
  type ContentRadarOutput,
  contentRadarOutputSchema,
  type RadarSignalInput,
} from "@poynt/planner-validators";
import { Output, streamText } from "ai";
import { flagshipModel } from "./models";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Innholdsradar — AI-syntese. Tar ferdig utregnede signaler om On Poynts
 * innholdsbibliotek og destillerer dem til konkrete redaksjonelle forslag.
 *
 * Prinsipp (se docs/CONTENT-RADAR.md): koden eier FAKTA (signalene + deres
 * prioritet), AI-en eier FORTELLINGEN (hva man bør gjøre og hvorfor). AI-en
 * får ikke finne på tall — den refererer til en `signalKey` vi matet inn, og
 * koden slår opp deterministisk prioritet/evidens fra den.
 *
 * Bruker det stabile `streamText` + `Output.object`-API-et som resten av
 * verktøyene, men siden dette er en bakgrunnsjobb venter vi bare på det
 * ferdige `output`-objektet (ingen streaming til en klient).
 */
export async function synthesizeSuggestions(
  signals: RadarSignalInput[]
): Promise<ContentRadarOutput> {
  if (signals.length === 0) return { suggestions: [] };

  const currentYear = new Date().getFullYear();
  const system = await resolveSystemPrompt("content-radar-system", {
    currentYear,
  });

  const result = streamText({
    model: flagshipModel,
    system,
    prompt: buildPrompt(signals),
    output: Output.object({ schema: contentRadarOutputSchema }),
  });

  return await result.output;
}

const kindLabels: Record<string, string> = {
  stale: "Foreldet innhold (ikke oppdatert på lenge)",
  stuck_draft: "Utkast som har stått stille",
  coverage_gap: "Kategori med lite/ingen dekning",
  featured_rotation: "Fremhevet innhold som bør roteres",
  demand: "Etterspørsel fra medlemmenes verktøybruk",
};

/**
 * Renderer signalene som en nummerert, gruppert liste. Hvert signal viser sin
 * `key` eksplisitt, fordi AI-en MÅ sette samme `signalKey` på forslaget sitt.
 */
function buildPrompt(signals: RadarSignalInput[]): string {
  const byKind = new Map<string, RadarSignalInput[]>();
  for (const s of signals) {
    const list = byKind.get(s.kind) ?? [];
    list.push(s);
    byKind.set(s.kind, list);
  }

  const sections: string[] = [];
  for (const [kind, list] of byKind) {
    const lines = list
      .map((s) => `  - [signalKey: ${s.key}] ${s.summary}`)
      .join("\n");
    sections.push(`${kindLabels[kind] ?? kind}:\n${lines}`);
  }

  return `Her er ferdig utregnede signaler om On Poynts innholdsbibliotek. Lag konkrete redaksjonelle forslag basert KUN på disse.

${sections.join("\n\n")}

For hvert forslag:
- Sett "signalKey" til nøyaktig den signalKey-en forslaget bygger på (kopier den ordrett fra lista over).
- Velg riktig "type": create / refresh / promote / repurpose.
- Når forslaget gjelder eksisterende innhold, fyll inn "targetCollection" og "targetId" (de står i signalet). Ellers null.
- Sett "category" når forslaget gjelder en bestemt kategori. Ellers null.
- Skriv en "title" som er en konkret handling, og en "rationale" som binder signalet til handlingen.

Ikke lag flere forslag enn signalene støtter. Prioriter etterspørsel-signaler høyt.`;
}
