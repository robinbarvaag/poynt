import type { MetadataRoute } from "next";

/**
 * Content Signals (https://contentsignals.org) — forteller roboter hva
 * innholdet kan brukes til etter at det er hentet: søk, svar i AI-verktøy
 * (ai-input) og trening av modeller (ai-train). Om innholdet skal kunne
 * brukes til trening er Susannes valg — bytt `ai-train=yes` til `ai-train=no`
 * her om hun ombestemmer seg.
 */
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

/**
 * Innholdet i `/robots.txt`. Ren funksjon (testet); `app/robots.ts` sender
 * inn nettadressen.
 */
export function buildRobots(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // De to API-stiene er bilder som skal kunne hentes selv om resten av
      // /api er stengt: delingsbildet (og:image) og mediefilene, blant annet
      // logoen i Organization-JSON-LD. Lengste treff vinner over «/api».
      allow: ["/", "/api/og-image", "/api/media/file/"],
      // Admin, API og det innloggede medlemsområdet skal ikke indekseres.
      // Merk skråstreken: /on-poynt (uten) er den offentlige salgssiden for
      // medlemskapet og SKAL indekseres — kun undersidene er medlemsområdet.
      // Billettsidene er personlige (hemmelig lenke) og skal aldri indekseres.
      disallow: [
        "/admin",
        "/api",
        "/on-poynt/",
        "/forhandsvisning",
        "/eventer/billett/",
        "/innsjekk",
        "/intern",
      ],
      other: { "Content-Signal": CONTENT_SIGNAL },
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
