import { randomBytes } from "node:crypto";

/** Tegn uten forvekslingsfare (ingen 0/o, 1/l/i) — adressen skal kunne leses opp. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Tilfeldig suffiks til skjulte sider: 8 tegn fra et alfabet på 31 gir
 * ~40 bits — ikke gjettbart, men kort nok til å stå på en QR-kode-side og i
 * en adresse noen faktisk kan lese opp over telefon.
 */
export function secretSlugToken(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}
