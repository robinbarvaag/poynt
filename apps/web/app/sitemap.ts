import { SITE_URL } from "@/lib/seo";
import config from "@/payload.config";
import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

/** Felles type for én sitemap-oppføring. */
type Entry = MetadataRoute.Sitemap[number];

/**
 * Dynamisk sitemap. Henter publiserte/aktive dokumenter fra Payload og
 * kombinerer med de statiske oversiktssidene. `noIndex`-merkede sider utelates.
 * Cachet under «cms»-taggen — ellers kjører hvert crawler-treff fem
 * databasespørringer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("cms");
  cacheLife("hours");

  const payload = await getPayload({ config });

  const [pages, products, posts, services, caseStudies] = await Promise.all([
    payload
      .find({
        collection: "pages",
        where: { _status: { equals: "published" } },
        limit: 1000,
        depth: 0,
      })
      .catch(() => null),
    payload
      .find({
        collection: "products",
        where: { active: { equals: true } },
        limit: 1000,
        depth: 0,
      })
      .catch(() => null),
    payload
      .find({
        collection: "blog-posts",
        where: { _status: { equals: "published" } },
        limit: 1000,
        depth: 0,
      })
      .catch(() => null),
    payload
      .find({
        collection: "services",
        where: { active: { equals: true }, _status: { equals: "published" } },
        limit: 1000,
        depth: 0,
      })
      .catch(() => null),
    payload
      .find({
        collection: "case-studies",
        where: { _status: { equals: "published" } },
        limit: 1000,
        depth: 0,
      })
      .catch(() => null),
  ]);

  // Statiske oversiktssider.
  const staticRoutes: Entry[] = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tjenester`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/produkter`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blogg`, changeFrequency: "weekly", priority: 0.7 },
    {
      url: `${SITE_URL}/kundehistorier`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${SITE_URL}/podkast`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const pageRoutes: Entry[] = (pages?.docs ?? [])
    .filter((p) => p.slug && p.slug !== "forside" && p.slug !== "kontakt")
    .filter((p) => !p.meta?.noIndex)
    .map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const productRoutes: Entry[] = (products?.docs ?? [])
    .filter((p) => !p.meta?.noIndex)
    .map((p) => ({
      url: `${SITE_URL}/produkter/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const postRoutes: Entry[] = (posts?.docs ?? [])
    .filter((p) => !p.meta?.noIndex)
    .map((p) => ({
      url: `${SITE_URL}/blogg/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const serviceRoutes: Entry[] = (services?.docs ?? [])
    .filter((s) => !s.meta?.noIndex)
    .map((s) => ({
      url: `${SITE_URL}/tjenester/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const caseStudyRoutes: Entry[] = (caseStudies?.docs ?? [])
    .filter((c) => !c.meta?.noIndex)
    .map((c) => ({
      url: `${SITE_URL}/kundehistorier/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [
    ...staticRoutes,
    ...pageRoutes,
    ...productRoutes,
    ...postRoutes,
    ...serviceRoutes,
    ...caseStudyRoutes,
  ];
}
