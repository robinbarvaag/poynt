import { HeroBlock } from "./blocks/hero-block";
import { ContentBlock } from "./blocks/content-block";
import { MediaBlockComponent } from "./blocks/media-block";
import { ArchiveBlock } from "./blocks/archive-block";

interface Block {
  blockType: string;
  [key: string]: any;
}

interface RenderBlocksProps {
  blocks: Block[];
}

export function RenderBlocks({ blocks }: RenderBlocksProps) {
  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case "hero":
            return <HeroBlock key={index} {...block} />;
          case "content":
            return <ContentBlock key={index} {...block} />;
          case "media":
            return <MediaBlockComponent key={index} {...block} />;
          case "archive":
            return <ArchiveBlock key={index} {...block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
