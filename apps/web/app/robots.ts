import { buildRobots } from "@/lib/robots";
import { SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

/** Reglene ligger i `lib/robots.ts`, der de kan testes. */
export default function robots(): MetadataRoute.Robots {
  // På Vercel er bare produksjon indekserbar; lokalt (uten VERCEL_ENV) vises
  // de vanlige reglene.
  const vercelEnv = process.env.VERCEL_ENV;
  return buildRobots(SITE_URL, {
    indexable: !vercelEnv || vercelEnv === "production",
  });
}
