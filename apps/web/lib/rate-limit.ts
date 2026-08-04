/**
 * Enkel rate limiting i minnet (fast vindu per IP). Godt nok som spam-brems
 * for åpne endepunkter (skjema, nyhetsbrev, kupong, checkout) — poenget er å
 * stoppe løkker som brenner Resend-kvote/Stripe-kall, ikke å være vanntett.
 *
 * NB: telleren er per serverinstans. På Vercel med flere instanser blir den
 * effektive grensen (antall instanser × limit) — fortsatt en reell brems.
 * Trengs noe strengere senere: bytt implementasjonen her mot Upstash/Redis
 * uten å røre kallstedene.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Hent beste tilgjengelige klient-IP fra request-headere. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "ukjent";
}

/**
 * Returnerer true hvis kallet er innenfor grensen, false hvis det skal avvises.
 * `name` skiller endepunkter fra hverandre (samme IP kan ha ulike kvoter).
 */
export function rateLimit(
  name: string,
  ip: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): boolean {
  const now = Date.now();
  const key = `${name}:${ip}`;

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    // Enkel opprydding: ved mange nøkler, kast alle utløpte før vi legger til.
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}
