import { slugifyAnchor } from "@/lib/format";
import type { Page } from "@/payload-types";
import { BlockSection } from "@poynt/ui";
import { type ComponentProps, Fragment, type ReactNode } from "react";
import { ContentBlock } from "./blocks/content-block";
import { ContentMediaBlock } from "./blocks/content-media-block";
import { CtaSectionBlock } from "./blocks/cta-section-block";
import { FaqBlock } from "./blocks/faq-block";
import { FeatureGridBlock } from "./blocks/feature-grid-block";
import { FormBlockComponent } from "./blocks/form-block";
import { HeroBlock } from "./blocks/hero-block";
import { LogoCloudBlock } from "./blocks/logo-cloud-block";
import { MediaBlockComponent } from "./blocks/media-block";
import { NewsletterBlock } from "./blocks/newsletter-block";
import { PathCardsBlock } from "./blocks/path-cards-block";
import { PodcastArchiveBlock } from "./blocks/podcast-archive-block";
import { PricingBlock } from "./blocks/pricing-block";
import { ProductArchiveBlock } from "./blocks/product-archive-block";
import { ServicesArchiveBlock } from "./blocks/services-archive-block";
import { SpotifyEmbedBlock } from "./blocks/spotify-embed-block";
import { StatsBandBlock } from "./blocks/stats-band-block";
import { StepsBlock } from "./blocks/steps-block";
import { TestimonialsBlock } from "./blocks/testimonials-block";

type Block = NonNullable<Page["layout"]>[number];

interface RenderBlocksProps {
  blocks: Block[];
}

// Full-bleed / self-styled blocks render as-is, never wrapped in BlockSection.
// The data-driven archives wrap THEMSELVES in a BlockSection so that when they
// have no content (return null) nothing renders at all — otherwise the central
// wrapper would leave an empty, padded "ghost" section (e.g. an empty podcast
// band when no episodes exist). They also don't advance the rhythm counter.
const SPECIAL_BLOCK_TYPES = new Set([
  "hero",
  "ctaSection",
  "media",
  "statsBand",
  "newsletter",
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
]);

function renderBlock(block: Block): ReactNode {
  switch (block.blockType) {
    case "hero":
      return (
        <HeroBlock
          {...(block as unknown as ComponentProps<typeof HeroBlock>)}
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

export function RenderBlocks({ blocks }: RenderBlocksProps) {
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
        // scroll-mt holder seksjonen klar av den faste headeren ved hopp.
        const anchorId = block.blockName
          ? slugifyAnchor(block.blockName)
          : undefined;

        const content = SPECIAL_BLOCK_TYPES.has(block.blockType) ? (
          element
        ) : (
          <BlockSection
            background="default"
            containerSize={false}
            reveal={!SELF_REVEAL_BLOCK_TYPES.has(block.blockType)}
          >
            {element}
          </BlockSection>
        );

        if (anchorId) {
          return (
            <div key={key} id={anchorId} className="scroll-mt-28">
              {content}
            </div>
          );
        }

        return <Fragment key={key}>{content}</Fragment>;
      })}
    </div>
  );
}
