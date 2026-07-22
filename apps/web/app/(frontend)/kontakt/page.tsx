import { PageHero } from "@/components/page-hero";
import { RenderBlocks } from "@/components/render-blocks";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

/**
 * Dedikert /kontakt-side. Eier ruta eksplisitt (i stedet for [...slug]-catch-all)
 * slik at intercepting-routen @modal/(.)kontakt har en entydig søsken-rute å pare
 * med. Innholdet hentes fortsatt fra Payload-sida med slug "kontakt", så partneren
 * styrer hero + skjema fra admin som før. Vises ved refresh/direktelenke; ved
 * klient-navigasjon overtar modalet.
 */
async function getContactPage() {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });
  const pages = await payload.find({
    collection: "pages",
    where: { slug: { equals: "kontakt" } },
    limit: 1,
    depth: 2,
  });
  return pages.docs[0] || null;
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContactPage();
  if (!page) return notFoundMetadata("Side ikke funnet");

  const seo = page.meta || {};
  return buildMetadata({
    title: seo.title || page.title,
    description: seo.description ?? undefined,
    path: "/kontakt",
    image: seo.image,
  });
}

export default async function ContactPage() {
  const page = await getContactPage();
  if (!page) notFound();

  const firstBlock = page.layout?.[0];
  const hasHeroBlock = firstBlock?.blockType === "hero";

  return (
    <>
      {!hasHeroBlock && <PageHero title={page.title} size="large" />}
      {page.layout && <RenderBlocks blocks={page.layout} />}
    </>
  );
}
