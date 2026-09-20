import { createHash } from "node:crypto";
import sharp from "sharp";

/**
 * Fingeravtrykk for bilder, brukt til duplikatsøk i mediebiblioteket.
 *
 * To avtrykk, fordi de fanger hver sin type dublett:
 *  - `contentHash` (sha256 av fila) finner nøyaktig samme fil lastet opp to
 *    ganger. Raskt og uten falske treff.
 *  - `perceptualHash` (dHash, 64 bit) finner samme motiv selv om fila er
 *    skalert, komprimert på nytt eller lagret i et annet format — det som
 *    faktisk skjer når det samme bildet hentes fra to kilder.
 */

export function contentHash(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * dHash: krymp til 9×8 gråtoner og sammenlign hver piksel med naboen til
 * høyre. Resultatet er 64 bit som endrer seg lite når bildet skaleres eller
 * komprimeres, men mye når motivet er et annet. Returneres som 16 hex-tegn.
 */
export async function perceptualHash(bytes: Buffer): Promise<null | string> {
  try {
    const { data } = await sharp(bytes, { animated: false })
      .greyscale()
      .resize(9, 8, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (data.length < 72) return null;

    let hex = "";
    let nibble = 0;
    let bitsInNibble = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = data[row * 9 + col] ?? 0;
        const right = data[row * 9 + col + 1] ?? 0;
        nibble = (nibble << 1) | (left < right ? 1 : 0);
        bitsInNibble++;
        if (bitsInNibble === 4) {
          hex += nibble.toString(16);
          nibble = 0;
          bitsInNibble = 0;
        }
      }
    }

    return hex;
  } catch {
    // Formater sharp ikke leser (svg, enkelte videoer) har ikke noe avtrykk.
    return null;
  }
}

/** Antall bit som skiller to dHash-er. 0 = identisk motiv. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    const diff =
      Number.parseInt(a[i] as string, 16) ^ Number.parseInt(b[i] as string, 16);
    if (Number.isNaN(diff)) return Number.POSITIVE_INFINITY;
    // Teller settede bit i én nibble.
    distance +=
      ((diff >> 3) & 1) + ((diff >> 2) & 1) + ((diff >> 1) & 1) + (diff & 1);
  }
  return distance;
}

/**
 * Terskel for «ligner på». 64 bit totalt; opptil 6 bits forskjell er i praksis
 * samme motiv, mens ulike bilder typisk ligger over 20.
 */
export const SIMILAR_THRESHOLD = 6;

/** Bare raster-bilder har et meningsfullt avtrykk. */
export function supportsHashing(mimeType: null | string | undefined): boolean {
  return Boolean(
    mimeType?.startsWith("image/") && mimeType !== "image/svg+xml"
  );
}
