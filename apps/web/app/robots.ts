import { buildRobots } from "@/lib/robots";
import { SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

/** Reglene ligger i `lib/robots.ts`, der de kan testes. */
export default function robots(): MetadataRoute.Robots {
  return buildRobots(SITE_URL);
}
