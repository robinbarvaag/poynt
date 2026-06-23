import type { Guide } from "@/payload-types";
import { type TocItem, extractToc } from "./extract-toc";

/**
 * Samler innholdsfortegnelse på tvers av alle `guideRichText`-blokker i en guide,
 * i rekkefølge. Gjenbruker `extractToc` per blokk.
 */
export function extractGuideToc(blocks: Guide["content"]): TocItem[] {
  if (!blocks) return [];
  const items: TocItem[] = [];
  for (const block of blocks) {
    if (block.blockType === "guideRichText") {
      items.push(
        ...extractToc(
          block.content as unknown as { root: { children: never[] } }
        )
      );
    }
  }
  return items;
}
