import { gateway, generateText } from "ai";
import sharp from "sharp";

/**
 * Alt-tekst fra en vision-modell. Delt mellom `/api/ai/alt-text` (knappen i
 * Media-skjemaet) og `beforeChange`-hooken på Media, som fyller alt-teksten
 * automatisk når et nytt bilde lastes opp.
 *
 * Kallet går via Vercel AI Gateway, som resten av AI-verktøyene.
 */

const ALT_SYSTEM = `Du skriver alt-tekst for bilder på et norsk nettsted.
Returner KUN selve alt-teksten – ingen anførselstegn, ingen forklaring, ingen «Alt-tekst:».
Skriv på norsk bokmål, i én konsis og konkret setning (sikt mot maks ~125 tegn).
Ikke begynn med «Bilde av», «Et bilde som viser» e.l. – beskriv motivet direkte.
Beskriv det viktigste motivet, eventuell handling og stemning. Tar bildet med tydelig tekst (f.eks. en plakat), ta med den viktige teksten.`;

const altModel = gateway("anthropic/claude-sonnet-4-6");

/** Lengste kant vi sender til modellen. Nok til å lese motiv og plakattekst. */
const MAX_EDGE = 1400;

/**
 * Vision-modeller trenger ikke full oppløsning, og store bilder koster både
 * tokens og ventetid. Vi krymper til jpeg før kallet. Feiler sharp (f.eks. et
 * format den ikke leser), sendes originalen videre uendret.
 */
async function shrinkForVision(
  bytes: Uint8Array,
  mediaType: string
): Promise<{ bytes: Uint8Array; mediaType: string }> {
  try {
    const buffer = await sharp(Buffer.from(bytes), { animated: false })
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      // Hvitt bak gjennomsiktige png-er, ellers blir motivet svart på svart.
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return { bytes: new Uint8Array(buffer), mediaType: "image/jpeg" };
  } catch {
    return { bytes, mediaType };
  }
}

/** Formater modellen faktisk kan se på. Svg er vektor og blir avvist. */
export function supportsAltTextGeneration(
  mimeType: string | null | undefined
): boolean {
  return Boolean(
    mimeType?.startsWith("image/") && mimeType !== "image/svg+xml"
  );
}

export async function generateAltText({
  bytes,
  mediaType,
}: {
  bytes: Uint8Array;
  mediaType: string;
}): Promise<string> {
  const image = await shrinkForVision(bytes, mediaType);

  const { text } = await generateText({
    model: altModel,
    system: ALT_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Skriv alt-tekst for dette bildet." },
          { type: "image", image: image.bytes, mediaType: image.mediaType },
        ],
      },
    ],
  });

  return text
    .trim()
    .replace(/^["«»]+|["«»]+$/g, "")
    .trim();
}
