import { slugifyAnchor } from "@/lib/format";
import type { Page } from "@/payload-types";
import { BlockSection } from "@poynt/ui";
import { type ComponentProps, Fragment, type ReactNode } from "react";
import { AiWorkflowBlock } from "./blocks/ai-workflow-block";
import { BookHeroBlock } from "./blocks/book-hero-block";
import { CarouselBlock } from "./blocks/carousel-block";
import { ChangeWheelBlock } from "./blocks/change-wheel-block";
import { ChapterPortalBlock } from "./blocks/chapter-portal-block";
import { ContentBlock } from "./blocks/content-block";
import { ContentMediaBlock } from "./blocks/content-media-block";
import { CountdownBlockComponent } from "./blocks/countdown-block";
import { CtaSectionBlock } from "./blocks/cta-section-block";
import { FaqBlock } from "./blocks/faq-block";
import { FeatureGridBlock } from "./blocks/feature-grid-block";
import { FormBlockComponent } from "./blocks/form-block";
import { GrowthCalculatorBlock } from "./blocks/growth-calculator-block";
import { HeroBlock } from "./blocks/hero-block";
import { LogoCloudBlock } from "./blocks/logo-cloud-block";
import { MarqueeBlockComponent } from "./blocks/marquee-block";
import { MediaBlockComponent } from "./blocks/media-block";
import { MythCardsBlock } from "./blocks/myth-cards-block";
import { NewsletterBlock } from "./blocks/newsletter-block";
import { PathCardsBlock } from "./blocks/path-cards-block";
import { PodcastArchiveBlock } from "./blocks/podcast-archive-block";
import { PricingBlock } from "./blocks/pricing-block";
import { ProductArchiveBlock } from "./blocks/product-archive-block";
import { ProductSpotlightBlock } from "./blocks/product-spotlight-block";
import { PromptLibraryBlock } from "./blocks/prompt-library-block";
import { ResourceListBlock } from "./blocks/resource-list-block";
import { SalesRitualBlock } from "./blocks/sales-ritual-block";
import { ServicesArchiveBlock } from "./blocks/services-archive-block";
import { SpotifyEmbedBlock } from "./blocks/spotify-embed-block";
import { StatsBandBlock } from "./blocks/stats-band-block";
import { StepsBlock } from "./blocks/steps-block";
import { TestimonialsBlock } from "./blocks/testimonials-block";
import { VekstCheckBlock } from "./blocks/vekst-check-block";

type Block = NonNullable<Page["layout"]>[number];

interface RenderBlocksProps {
  blocks: Block[];
  /**
   * Vertikal rytme mellom blokkene. Default "lg" (vanlige sider). Oversikts-
   * sider med sidemeny bruker "md" — der står blokkene i én smalere kolonne
   * og trenger mindre luft for å henge sammen.
   */
  spacing?: "md" | "lg";
}

// Full-bleed / self-styled blocks render as-is, never wrapped in BlockSection.
// Hero/media er ekte full-bleed; de data-drevne arkivene pakker SEG SELV i en
// BlockSection slik at når de ikke har innhold (returnerer null) rendres
// ingenting — ellers ville den sentrale wrapperen etterlatt en tom, paddet
// «spøkelses»-seksjon. Alt annet (også panelblokkene statsBand/ctaSection/
// newsletter) går gjennom den sentrale BlockSection, så hele siden deler én
// spacing og én innholdsbredde (`Container` default).
const SPECIAL_BLOCK_TYPES = new Set([
  "hero",
  "bookHero",
  "marquee",
  "media",
  "productArchive",
  "podcastArchive",
  "servicesArchive",
]);

// Blocks that manage their own scroll-reveal (Reveal/Stagger internally), so
// BlockSection should NOT add its blanket reveal on top — avoids double motion.
const SELF_REVEAL_BLOCK_TYPES = new Set([
  "featureGrid",
  "steps",
  "contentMedia",
  "pricing",
  "faq",
  "logoCloud",
  "pathCards",
  "statsBand",
  "newsletter",
  "carousel",
  "countdown",
  "resourceList",
  "promptLibrary",
  "chapterPortal",
  "vekstCheck",
  "changeWheel",
  "growthCalculator",
  "mythCards",
  "aiWorkflow",
  "salesRitual",
]);

function renderBlock(block: Block): ReactNode {
  switch (block.blockType) {
    case "hero":
      return (
        <HeroBlock
          {...(block as unknown as ComponentProps<typeof HeroBlock>)}
        />
      );
    case "bookHero":
      return (
        <BookHeroBlock
          {...(block as unknown as ComponentProps<typeof BookHeroBlock>)}
        />
      );
    case "countdown":
      return (
        <CountdownBlockComponent
          {...(block as unknown as ComponentProps<
            typeof CountdownBlockComponent
          >)}
        />
      );
    case "marquee":
      return (
        <MarqueeBlockComponent
          {...(block as unknown as ComponentProps<
            typeof MarqueeBlockComponent
          >)}
        />
      );
    case "content":
      return (
        <ContentBlock
          {...(block as unknown as ComponentProps<typeof ContentBlock>)}
        />
      );
    case "featureGrid":
      return (
        <FeatureGridBlock
          {...(block as unknown as ComponentProps<typeof FeatureGridBlock>)}
        />
      );
    case "steps":
      return (
        <StepsBlock
          {...(block as unknown as ComponentProps<typeof StepsBlock>)}
        />
      );
    case "contentMedia":
      return (
        <ContentMediaBlock
          {...(block as unknown as ComponentProps<typeof ContentMediaBlock>)}
        />
      );
    case "statsBand":
      return (
        <StatsBandBlock
          {...(block as unknown as ComponentProps<typeof StatsBandBlock>)}
        />
      );
    case "pricing":
      return (
        <PricingBlock
          {...(block as unknown as ComponentProps<typeof PricingBlock>)}
        />
      );
    case "faq":
      return (
        <FaqBlock {...(block as unknown as ComponentProps<typeof FaqBlock>)} />
      );
    case "logoCloud":
      return (
        <LogoCloudBlock
          {...(block as unknown as ComponentProps<typeof LogoCloudBlock>)}
        />
      );
    case "newsletter":
      return (
        <NewsletterBlock
          {...(block as unknown as ComponentProps<typeof NewsletterBlock>)}
        />
      );
    case "media":
      return (
        <MediaBlockComponent
          {...(block as unknown as ComponentProps<typeof MediaBlockComponent>)}
        />
      );
    case "podcastArchive":
      return (
        <PodcastArchiveBlock
          {...(block as unknown as ComponentProps<typeof PodcastArchiveBlock>)}
        />
      );
    case "productArchive":
      return (
        <ProductArchiveBlock
          {...(block as unknown as ComponentProps<typeof ProductArchiveBlock>)}
        />
      );
    case "productSpotlight":
      return (
        <ProductSpotlightBlock
          {...(block as unknown as ComponentProps<
            typeof ProductSpotlightBlock
          >)}
        />
      );
    case "servicesArchive":
      return (
        <ServicesArchiveBlock
          {...(block as unknown as ComponentProps<typeof ServicesArchiveBlock>)}
        />
      );
    case "pathCards":
      return (
        <PathCardsBlock
          {...(block as unknown as ComponentProps<typeof PathCardsBlock>)}
        />
      );
    case "carousel":
      return (
        <CarouselBlock
          {...(block as unknown as ComponentProps<typeof CarouselBlock>)}
        />
      );
    case "testimonials":
      return (
        <TestimonialsBlock
          {...(block as unknown as ComponentProps<typeof TestimonialsBlock>)}
        />
      );
    case "ctaSection":
      return (
        <CtaSectionBlock
          {...(block as unknown as ComponentProps<typeof CtaSectionBlock>)}
        />
      );
    case "spotify-embed":
      return (
        <SpotifyEmbedBlock
          {...(block as unknown as ComponentProps<typeof SpotifyEmbedBlock>)}
        />
      );
    case "resourceList":
      return (
        <ResourceListBlock
          {...(block as unknown as ComponentProps<typeof ResourceListBlock>)}
        />
      );
    case "promptLibrary":
      return (
        <PromptLibraryBlock
          {...(block as unknown as ComponentProps<typeof PromptLibraryBlock>)}
        />
      );
    case "chapterPortal":
      return (
        <ChapterPortalBlock
          {...(block as unknown as ComponentProps<typeof ChapterPortalBlock>)}
        />
      );
    case "vekstCheck":
      return (
        <VekstCheckBlock
          {...(block as unknown as ComponentProps<typeof VekstCheckBlock>)}
        />
      );
    case "changeWheel":
      return (
        <ChangeWheelBlock
          {...(block as unknown as ComponentProps<typeof ChangeWheelBlock>)}
        />
      );
    case "growthCalculator":
      return (
        <GrowthCalculatorBlock
          {...(block as unknown as ComponentProps<
            typeof GrowthCalculatorBlock
          >)}
        />
      );
    case "mythCards":
      return (
        <MythCardsBlock
          {...(block as unknown as ComponentProps<typeof MythCardsBlock>)}
        />
      );
    case "aiWorkflow":
      return (
        <AiWorkflowBlock
          {...(block as unknown as ComponentProps<typeof AiWorkflowBlock>)}
        />
      );
    case "salesRitual":
      return (
        <SalesRitualBlock
          {...(block as unknown as ComponentProps<typeof SalesRitualBlock>)}
        />
      );
    case "formBlock":
      return (
        <FormBlockComponent
          {...(block as unknown as ComponentProps<typeof FormBlockComponent>)}
        />
      );
    default:
      return null;
  }
}

export function RenderBlocks({ blocks, spacing = "lg" }: RenderBlocksProps) {
  // Én jevn bakgrunn (Azure) hele veien — INGEN veksel-tint mellom seksjoner.
  // Farge/rytme kommer fra innholdet: fargede kort (path/produkt/testimonials)
  // og flytende avrundede paneler (statsBand/ctaSection colored/newsletter).
  // Det fjerner alle harde fullbredde-overganger. Spacing gir luft mellom blokk.
  return (
    <div>
      {blocks.map((block, index) => {
        const key = block.id ?? index;
        const element = renderBlock(block);

        if (element === null) {
          return null;
        }

        // Et «Blokk-navn» i admin gir blokka en adresserbar #anker, slik at
        // menyen kan lenke rett til seksjonen (f.eks. /for-bedrifter#styre).
        // scroll-mt holder seksjonen klar av den faste headeren ved hopp — og
        // på mobil også av HubLayouts sticky meny som ligger under headeren.
        const anchorId = block.blockName
          ? slugifyAnchor(block.blockName)
          : undefined;

        const content = SPECIAL_BLOCK_TYPES.has(block.blockType) ? (
          element
        ) : (
          <BlockSection
            background="default"
            spacing={spacing}
            containerSize={false}
            reveal={!SELF_REVEAL_BLOCK_TYPES.has(block.blockType)}
          >
            {element}
          </BlockSection>
        );

        if (anchorId) {
          return (
            <div
              key={key}
              id={anchorId}
              className="scroll-mt-36 lg:scroll-mt-28"
            >
              {content}
            </div>
          );
        }

        return <Fragment key={key}>{content}</Fragment>;
      })}
    </div>
  );
}
