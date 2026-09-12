import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { RenderBlocks } from "@/components/render-blocks";
import { slugifyAnchor } from "@/lib/format";
import { isHeroBlockType } from "@/lib/kontakt-page";
import { faqSchema } from "@/lib/structured-data";
import type { Page } from "@/payload-types";
import { HubLayout, type HubNavItem, LandingCanvas } from "@poynt/ui";

type Block = NonNullable<Page["layout"]>[number];

/**
 * Menypunktene på en oversiktsside: hver blokk med et «Blokk-navn» i admin.
 * Samme slugify som RenderBlocks bruker til #ankeret, så menyen og seksjonen
 * kan ikke komme ut av synk.
 */
function hubNavFrom(blocks: Block[]): HubNavItem[] {
  return blocks
    .filter((block) => block.blockName)
    .map((block) => ({
      id: slugifyAnchor(block.blockName as string),
      label: block.blockName as string,
    }));
}

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

  let body: React.ReactNode;

  if (page.pageType === "hub") {
    // Oversiktsside: heroen (om den finnes) går i full bredde over, resten
    // står i én kolonne med en sticky sidemeny bygd av blokk-navnene.
    const blocks = page.layout ?? [];
    const hero = hasHeroBlock ? blocks.slice(0, 1) : [];
    const rest = hasHeroBlock ? blocks.slice(1) : blocks;
    body = (
      <>
        {hasHeroBlock ? (
          <RenderBlocks blocks={hero} />
        ) : (
          <PageHero title={page.title} size="large" />
        )}
        <HubLayout nav={hubNavFrom(rest)}>
          <RenderBlocks blocks={rest} spacing="md" />
        </HubLayout>
      </>
    );
  } else {
    body = (
      <>
        {!hasHeroBlock && <PageHero title={page.title} size="large" />}
        {page.layout && <RenderBlocks blocks={page.layout} />}
      </>
    );
  }

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
