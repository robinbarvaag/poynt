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
const SPECIAL_BLOCK_TYPES = new Set([
  "hero",
  "ctaSection",
  "media",
  "statsBand",
  "newsletter",
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
  // Rhythm: alternate background across STANDARD (wrapped) blocks only.
  // 1st standard "default", 2nd "muted", 3rd "default", … — special blocks
  // (hero/ctaSection/media) are skipped and don't advance the counter.
  let standardIndex = -1;

  return (
    <div>
      {blocks.map((block, index) => {
        const key = block.id ?? index;
        const element = renderBlock(block);

        if (element === null) {
          return null;
        }

        if (SPECIAL_BLOCK_TYPES.has(block.blockType)) {
          return <Fragment key={key}>{element}</Fragment>;
        }

        standardIndex += 1;
        const background = standardIndex % 2 === 1 ? "muted" : "default";

        return (
          <BlockSection
            key={key}
            background={background}
            containerSize={false}
            reveal={!SELF_REVEAL_BLOCK_TYPES.has(block.blockType)}
          >
            {element}
          </BlockSection>
        );
      })}
    </div>
  );
}
