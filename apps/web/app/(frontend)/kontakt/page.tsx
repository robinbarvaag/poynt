import { PageHero } from "@/components/page-hero";
import { RenderBlocks } from "@/components/render-blocks";
import { getKontaktPage, isHeroBlockType } from "@/lib/kontakt-page";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Dedikert /kontakt-side. Eier ruta eksplisitt (i stedet for [...slug]-catch-all)
 * slik at intercepting-routen @modal/(.)kontakt har en entydig søsken-rute å pare
 * med. Innholdet hentes fortsatt fra Payload-sida med slug "kontakt" (delt
 * henter i lib/kontakt-page.ts), så partneren styrer hero + skjema fra admin
 * som før. Vises ved refresh/direktelenke; ved klient-navigasjon overtar modalet.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getKontaktPage();
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
  const page = await getKontaktPage();
  if (!page) notFound();

  const firstBlock = page.layout?.[0];
  const hasHeroBlock = isHeroBlockType(firstBlock?.blockType);

  return (
    <>
      {!hasHeroBlock && <PageHero title={page.title} size="large" />}
      {page.layout && <RenderBlocks blocks={page.layout} />}
    </>
  );
}
