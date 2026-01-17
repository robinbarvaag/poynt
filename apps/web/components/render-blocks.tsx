import { ArchiveBlock } from "./blocks/archive-block";
import { ContentBlock } from "./blocks/content-block";
import { CtaSectionBlock } from "./blocks/cta-section-block";
import { FeaturesBlock } from "./blocks/features-block";
import { HeroBlock } from "./blocks/hero-block";
import { MediaBlockComponent } from "./blocks/media-block";
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
          case "features":
            return <FeaturesBlock key={index} {...(block as any)} />;
          case "testimonials":
            return <TestimonialsBlock key={index} {...(block as any)} />;
          case "ctaSection":
            return <CtaSectionBlock key={index} {...(block as any)} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
