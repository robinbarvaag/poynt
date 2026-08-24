import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { RenderBlocks } from "@/components/render-blocks";
import { isHeroBlockType } from "@/lib/kontakt-page";
import { faqSchema } from "@/lib/structured-data";
import type { Page } from "@/payload-types";
import { LandingCanvas } from "@poynt/ui";

/**
 * Delt rendring av en CMS-side (pages-collection) — brukes både av den
 * offentlige [...slug]-ruta (publisert, statisk) og /forhandsvisning (utkast).
 * Ingen draft-logikk her; hvem som mater inn dokumentet avgjør hva som vises.
 */
export function CmsPageView({ page }: { page: Page }) {
  // Sjekk om første blokk er en hero - da viser vi ikke egen page hero
  const firstBlock = page.layout?.[0];
  const hasHeroBlock = isHeroBlockType(firstBlock?.blockType);

  const faqLd = faqSchema(page.faq);

  const body = (
    <>
      {!hasHeroBlock && <PageHero title={page.title} size="large" />}
      {page.layout && <RenderBlocks blocks={page.layout} />}
    </>
  );

  return (
    <>
      <AdminBar collection="pages" id={String(page.id)} singular="side" />
      {faqLd && <JsonLd data={faqLd} />}
      {page.pageType === "landing" ? (
        <LandingCanvas>{body}</LandingCanvas>
      ) : (
        body
      )}
    </>
  );
}
