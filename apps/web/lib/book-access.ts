import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Tilgang til sider som krever bokkjøp («Krever bokkjøp» på en side).
 *
 * Vi kan ikke slå opp ordrenumre hos ARK/Norli, så sjekken er en bevisst
 * lav terskel: gyldig format + logg i «Boktilganger». Verdien ligger i loggen
 * — Susanne ser hvem som har registrert seg, og et ordrenummer som dukker opp
 * mange ganger kan sperres.
 *
 * Etter godkjent registrering får nettleseren en httpOnly-cookie per side,
 * signert med PAYLOAD_SECRET, så den ikke kan lages for hånd.
 */

export { BOOK_STORES, type BookStore } from "./book-stores";

/** Et ordrenummer brukt flere ganger enn dette markeres i admin. */
export const SUSPICIOUS_USES = 5;

const COOKIE_PREFIX = "poynt_bok_";
export const BOOK_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function bookCookieName(pageId: string | number): string {
  return `${COOKIE_PREFIX}${pageId}`;
}

/** Store bokstaver, uten mellomrom — «ark 12 345» og «ARK12345» er samme ordre. */
export function normalizeOrderNumber(input: string): string {
  return input.toUpperCase().replace(/\s+/g, "");
}

/** Formatet til ARK og Norli varierer — krev bare noe som ligner et ordrenummer. */
export function isPlausibleOrderNumber(normalized: string): boolean {
  return /^[A-Z0-9-]{5,30}$/.test(normalized) && /\d{4,}/.test(normalized);
}

function secret(): string {
  const value = process.env.PAYLOAD_SECRET;
  if (!value) throw new Error("PAYLOAD_SECRET er ikke satt");
  return value;
}

function sign(pageId: string, accessId: string): string {
  return createHmac("sha256", secret())
    .update(`bok:${pageId}:${accessId}`)
    .digest("base64url")
    .slice(0, 32);
}

export function createBookCookieValue(
  pageId: string | number,
  accessId: string | number
): string {
  return `${accessId}.${sign(String(pageId), String(accessId))}`;
}

export function verifyBookCookie(
  pageId: string | number,
  value: string | undefined
): boolean {
  if (!value) return false;
  const [accessId, sig] = value.split(".");
  if (!accessId || !sig) return false;
  const expected = sign(String(pageId), accessId);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
