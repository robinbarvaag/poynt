import type {
  CompanyLookupResult,
  ProfileCompanySize,
} from "@poynt/planner-validators";
import { Output, streamText } from "ai";
import { z } from "zod";
import { type BrregEnhet, lookupOrgNumber } from "./brreg";
import { utilityModel } from "./models";

/**
 * Mapper antall ansatte (fra Brønnøysund) til profilens størrelse-enum.
 * Grensene følger enum-kommentarene i workspace-skjemaet
 * (solo 0-1 / small 2-10 / medium 11-50 / large 50+).
 */
export function mapEmployeesToCompanySize(
  count: number | null
): ProfileCompanySize | null {
  if (count == null) return null;
  if (count <= 1) return "solo";
  if (count <= 10) return "small";
  if (count <= 50) return "medium";
  return "large";
}

/** Minimalt bransje-utdrag — det vi trenger for å la AI velge riktig. */
export interface IndustryOption {
  id: string;
  name: string;
  description?: string | null;
}

/**
 * Klassifiserer en NACE-beskrivelse til en av de kuraterte bransjene via en
 * billig modell. Vi bruker AI (ikke en statisk NACE→bransje-tabell) fordi
 * bransjelista er admin-redigerbar — en hardkodet tabell ville råtnet. Lav
 * konfidens / ingen passende bransje → null (Bransje står tom til bruker velger).
 */
export async function classifyIndustry(
  naceDescription: string | null,
  industries: IndustryOption[]
): Promise<string | null> {
  if (!naceDescription || industries.length === 0) return null;

  const ids = industries.map((i) => i.id);
  // z.enum krever en ikke-tom tuple; "ukjent" er rømningsverdien.
  const choiceSchema = z.object({
    industryId: z.enum(["ukjent", ...ids] as [string, ...string[]]),
  });

  const list = industries
    .map(
      (i) => `- ${i.id}: ${i.name}${i.description ? ` (${i.description})` : ""}`
    )
    .join("\n");

  try {
    // Stabil, ikke-deprecated strukturert output (samme mønster som de andre
    // verktøyene): streamText + `output`, og vent på det ferdige objektet.
    const result = streamText({
      model: utilityModel,
      output: Output.object({ schema: choiceSchema }),
      prompt: `Du klassifiserer en norsk bedrift inn i ÉN bransje ut fra næringskoden dens.

Næringskode-beskrivelse: "${naceDescription}"

Tilgjengelige bransjer (velg id-en som passer best):
${list}

Velg den klart mest passende bransje-id-en. Hvis ingen passer rimelig godt, svar "ukjent".`,
    });

    const { industryId } = await result.output;
    return industryId === "ukjent" ? null : industryId;
  } catch {
    // Klassifisering er valgfri berikelse — la bransje stå tom ved feil.
    return null;
  }
}

/**
 * Orkestrerer hele oppslaget: henter bedriften fra Brønnøysund, mapper antall
 * ansatte → størrelse, og lar AI velge bransje. Returnerer et ferdig
 * forhåndsfyll-objekt UI-et kan legge inn i skjemaet (bruker bekrefter + lagrer).
 */
export async function buildCompanyProfilePrefill(
  orgNumber: string,
  industries: IndustryOption[]
): Promise<CompanyLookupResult> {
  const enhet: BrregEnhet = await lookupOrgNumber(orgNumber);

  const industryId = await classifyIndustry(enhet.naceDescription, industries);
  const industryName =
    industries.find((i) => i.id === industryId)?.name ?? null;

  return {
    orgNumber: enhet.orgNumber,
    companyName: enhet.name,
    website: enhet.website,
    employeeCount: enhet.employeeCount,
    naceCode: enhet.naceCode,
    naceDescription: enhet.naceDescription,
    companySize: mapEmployeesToCompanySize(enhet.employeeCount),
    industryId,
    industryName,
  };
}
