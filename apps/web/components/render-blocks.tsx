import { ArchiveBlock } from "./blocks/archive-block";
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

interface Block {
  blockType: string;
  [key: string]: any;
}

interface RenderBlocksProps {
  blocks: Block[];
}

export function RenderBlocks({ blocks }: RenderBlocksProps) {
  return (
    <div>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case "hero":
            return <HeroBlock key={index} {...(block as any)} />;
          case "content":
            return <ContentBlock key={index} {...(block as any)} />;
          case "media":
            return <MediaBlockComponent key={index} {...(block as any)} />;
          case "archive":
            return <ArchiveBlock key={index} {...(block as any)} />;
          case "podcastArchive":
            return <PodcastArchiveBlock key={index} {...(block as any)} />;
          case "productArchive":
            return <ProductArchiveBlock key={index} {...(block as any)} />;
          case "servicesArchive":
            return <ServicesArchiveBlock key={index} {...(block as any)} />;
          case "testimonials":
            return <TestimonialsBlock key={index} {...(block as any)} />;
          case "ctaSection":
            return <CtaSectionBlock key={index} {...(block as any)} />;
          case "spotify-embed":
            return <SpotifyEmbedBlock key={index} {...(block as any)} />;
          case "formBlock":
            return <FormBlockComponent key={index} {...(block as any)} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
