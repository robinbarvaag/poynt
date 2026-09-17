import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { RenderBlocks } from "@/components/render-blocks";
import { slugifyAnchor } from "@/lib/format";
import { isHeroBlockType } from "@/lib/kontakt-page";
import { faqSchema } from "@/lib/structured-data";
import type { Page } from "@/payload-types";
import { HubLayout, type HubNavItem, LandingCanvas } from "@poynt/ui";
import type { IconName } from "@poynt/ui/icons";

type Block = NonNullable<Page["layout"]>[number];

/**
 * Ikon per blokktype — menypunktene skal kunne skilles fra hverandre på et
 * halvt blikk, uten at redaktøren må velge noe i admin.
 */
const HUB_ICONS: Record<string, IconName> = {
  promptLibrary: "bot",
  resourceList: "download",
  featureGrid: "sparkles",
  steps: "layers",
  faq: "message-square",
  pathCards: "compass",
  carousel: "image",
  contentMedia: "image",
  content: "file-text",
  pricing: "wallet",
  testimonials: "quote",
  logoCloud: "building",
  statsBand: "bar-chart",
  newsletter: "mail",
  ctaSection: "send",
  productArchive: "briefcase",
  productSpotlight: "briefcase",
  podcastArchive: "headphones",
  spotifyEmbed: "headphones",
  servicesArchive: "wrench",
  form: "pencil",
  countdown: "timer",
  media: "image",
  chapterPortal: "compass",
  vekstCheck: "target",
  changeWheel: "refresh",
  growthCalculator: "wallet",
  mythCards: "lightbulb",
  aiWorkflow: "zap",
  salesRitual: "calendar-days",
};

/**
 * Hvor mange ting seksjonen inneholder, og hva de heter. Gir «8 prompter» i
 * stedet for bare «Prompter» — mengden er halve oversikten.
 */
const HUB_COUNTS: Record<string, { field: string; one: string; many: string }> =
  {
    promptLibrary: { field: "prompts", one: "prompt", many: "prompter" },
    resourceList: { field: "items", one: "ressurs", many: "ressurser" },
    featureGrid: { field: "features", one: "tips", many: "tips" },
    steps: { field: "steps", one: "steg", many: "steg" },
    faq: { field: "items", one: "spørsmål", many: "spørsmål" },
    pathCards: { field: "paths", one: "vei", many: "veier" },
    pricing: { field: "tiers", one: "pakke", many: "pakker" },
    testimonials: { field: "testimonials", one: "sitat", many: "sitater" },
    mythCards: { field: "myths", one: "løgn", many: "løgner" },
    aiWorkflow: {
      field: "workflows",
      one: "arbeidsflyt",
      many: "arbeidsflyter",
    },
    changeWheel: { field: "areas", one: "område", many: "områder" },
    salesRitual: { field: "checklist", one: "punkt", many: "punkter" },
  };

function hubMeta(block: Block): string | undefined {
  const spec = HUB_COUNTS[block.blockType];
  if (!spec) return undefined;
  const value = (block as unknown as Record<string, unknown>)[spec.field];
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return `${value.length} ${value.length === 1 ? spec.one : spec.many}`;
}

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
      icon: HUB_ICONS[block.blockType],
      meta: hubMeta(block),
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
