import { getNewsletterAudienceStats } from "@poynt/email";
import { canonicalizeEmail } from "@poynt/utils/email-normalize";
import type { Payload, Where } from "payload";
import {
  NEWSLETTER_CONSENT_SOURCES,
  type NewsletterConsentSource,
} from "./newsletter-consent-texts";

/**
 * Tall til statistikk-panelet over Nyhetsbrev-lista i admin. To kilder:
 * - Resend: selve abonnentlista (påmeldte, avmeldte, nye siste dager)
 * - Samtykkeloggen «newsletter-consents» i Payload: hvor folk meldte seg på
 *   (kilde), også bakover i tid — Resend lagrer kilde bare på nye kontakter.
 * Kun lesing. Resend-delen er null hvis API-et ikke svarer.
 */

export interface NewsletterSourceStat {
  source: NewsletterConsentSource;
  label: string;
  total: number;
  last30Days: number;
}

export interface NewsletterStats {
  audience: Awaited<ReturnType<typeof getNewsletterAudienceStats>> | null;
  /** Samtykker per kilde, sortert etter antall. Kilder uten påmeldinger tas med. */
  sources: NewsletterSourceStat[];
  /**
   * Samtykker i loggen totalt / siste 30 dager. Én rad per påmelding, så
   * samme person telles flere ganger hvis de meldte seg på flere steder —
   * `people` er antall unike adresser.
   */
  consents: {
    total: number;
    people: number;
    last30Days: number;
    failed: number;
  };
  newsletters: { sent: number; lastSentAt?: string };
}

export async function getNewsletterStats(
  payload: Payload
): Promise<NewsletterStats> {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const count = (where: Where) =>
    payload
      .count({ collection: "newsletter-consents", where, overrideAccess: true })
      .then((r) => r.totalDocs)
      .catch(() => 0);

  const [audience, sources, total, people, last30Days, failed, sent] =
    await Promise.all([
      process.env.RESEND_API_KEY
        ? getNewsletterAudienceStats().catch((error: unknown) => {
            console.error("Nyhetsbrev-statistikk: Resend feilet:", error);
            return null;
          })
        : Promise.resolve(null),
      Promise.all(
        NEWSLETTER_CONSENT_SOURCES.map(async (s) => ({
          source: s.value,
          label: s.label,
          total: await count({ source: { equals: s.value } }),
          last30Days: await count({
            and: [
              { source: { equals: s.value } },
              { createdAt: { greater_than_equal: since30 } },
            ],
          }),
        }))
      ),
      count({}),
      // Unike adresser: loggen er liten (én rad per påmelding), så vi henter
      // e-postene og teller selv.
      payload
        .find({
          collection: "newsletter-consents",
          limit: 0,
          pagination: false,
          depth: 0,
          select: { email: true },
          overrideAccess: true,
        })
        .then(
          (r) =>
            new Set(r.docs.map((d) => canonicalizeEmail(d.email ?? ""))).size
        )
        .catch(() => 0),
      count({ createdAt: { greater_than_equal: since30 } }),
      count({ subscribed: { equals: false } }),
      payload
        .find({
          collection: "newsletters",
          where: { status: { equals: "sent" } },
          sort: "-sentAt",
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => null),
    ]);

  return {
    audience,
    sources: sources.sort((a, b) => b.total - a.total),
    consents: { total, people, last30Days, failed },
    newsletters: {
      sent: sent?.totalDocs ?? 0,
      lastSentAt: sent?.docs[0]?.sentAt ?? undefined,
    },
  };
}
