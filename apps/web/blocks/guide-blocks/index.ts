import type { Block } from "payload";
import { GuideBookmark } from "./bookmark";
import { GuideCallout } from "./callout";
import { GuideColumns } from "./columns";
import { GuideDivider } from "./divider";
import { GuideDownload } from "./download";
import { GuideGallery } from "./gallery";
import { GuideImage } from "./image";
import { GuideRichText } from "./rich-text";
import { GuideToggle } from "./toggle";
import { GuideVideo } from "./video";

/**
 * Innholdsblokkene for Guider-kolleksjonen. Hver blokk har en tilsvarende
 * presentasjons-komponent i `@poynt/ui` (guide-mappen), matet av
 * `components/guides/guide-blocks.tsx` på frontend.
 */
export const guideBlocks: Block[] = [
  GuideRichText,
  GuideCallout,
  GuideColumns,
  GuideGallery,
  GuideImage,
  GuideVideo,
  GuideToggle,
  GuideBookmark,
  GuideDownload,
  GuideDivider,
];

export {
  GuideRichText,
  GuideCallout,
  GuideColumns,
  GuideGallery,
  GuideImage,
  GuideVideo,
  GuideToggle,
  GuideBookmark,
  GuideDownload,
  GuideDivider,
};
