import type { Page } from "@/payload-types";
import type { ComponentProps } from "react";
import { ContentBlock } from "./blocks/content-block";
import { CtaSectionBlock } from "./blocks/cta-section-block";
import { FormBlockComponent } from "./blocks/form-block";
import { HeroBlock } from "./blocks/hero-block";
import { MediaBlockComponent } from "./blocks/media-block";
import { PodcastArchiveBlock } from "./blocks/podcast-archive-block";
import { ProductArchiveBlock } from "./blocks/product-archive-block";
import { ServicesArchiveBlock } from "./blocks/services-archive-block";
import { SpotifyEmbedBlock } from "./blocks/spotify-embed-block";
import { TestimonialsBlock } from "./blocks/testimonials-block";

type Block = NonNullable<Page["layout"]>[number];

interface RenderBlocksProps {
  blocks: Block[];
}

export function RenderBlocks({ blocks }: RenderBlocksProps) {
  return (
    <div>
      {blocks.map((block, index) => {
        const key = block.id ?? index;
        switch (block.blockType) {
          case "hero":
            return (
              <HeroBlock
                key={key}
                {...(block as unknown as ComponentProps<typeof HeroBlock>)}
              />
            );
          case "content":
            return (
              <ContentBlock
                key={key}
                {...(block as unknown as ComponentProps<typeof ContentBlock>)}
              />
            );
          case "media":
            return (
              <MediaBlockComponent
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof MediaBlockComponent
                >)}
              />
            );
          case "podcastArchive":
            return (
              <PodcastArchiveBlock
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof PodcastArchiveBlock
                >)}
              />
            );
          case "productArchive":
            return (
              <ProductArchiveBlock
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof ProductArchiveBlock
                >)}
              />
            );
          case "servicesArchive":
            return (
              <ServicesArchiveBlock
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof ServicesArchiveBlock
                >)}
              />
            );
          case "testimonials":
            return (
              <TestimonialsBlock
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof TestimonialsBlock
                >)}
              />
            );
          case "ctaSection":
            return (
              <CtaSectionBlock
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof CtaSectionBlock
                >)}
              />
            );
          case "spotify-embed":
            return (
              <SpotifyEmbedBlock
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof SpotifyEmbedBlock
                >)}
              />
            );
          case "formBlock":
            return (
              <FormBlockComponent
                key={key}
                {...(block as unknown as ComponentProps<
                  typeof FormBlockComponent
                >)}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
