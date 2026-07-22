import sharp from "sharp";

/**
 * Genererer en bitteliten base64-versjon av et bilde (à la Sanitys `lqip`) til
 * bruk som `placeholder="blur"` i `next/image`. ~20 px bred webp ender typisk
 * på 200–500 bytes, så den kan trygt lagres rett i Media-dokumentet.
 *
 * Returnerer `null` hvis sharp ikke klarer å lese kilden (korrupt fil,
 * ustøttet format) — blur er ren pynt og skal aldri velte en opplasting.
 */
export async function generateBlurDataURL(
  source: Buffer
): Promise<string | null> {
  try {
    const buffer = await sharp(source)
      .resize(20, undefined, { withoutEnlargement: true })
      .webp({ quality: 30, alphaQuality: 30 })
      .toBuffer();
    return `data:image/webp;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Raster-bilder får blur; svg er vektor og video/pdf gir ikke mening. */
export function supportsBlurPlaceholder(
  mimeType: string | null | undefined
): boolean {
  return Boolean(
    mimeType?.startsWith("image/") && mimeType !== "image/svg+xml"
  );
}
