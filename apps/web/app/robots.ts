import { SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
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
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
