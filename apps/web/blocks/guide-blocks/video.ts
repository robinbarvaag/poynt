import type { Block } from "payload";
import { sectionHeaderFields, uploadVideoFields } from "./_shared";

/** Innebygd embed-video (YouTube/Loom/Vimeo) eller selv-hostet opplastet fil. */
export const GuideVideo: Block = {
  slug: "guideVideo",
  interfaceName: "GuideVideoBlock",
  labels: { singular: "Video", plural: "Videoer" },
  fields: [
    ...sectionHeaderFields,
    {
      name: "source",
      type: "select",
      label: "Kilde",
      defaultValue: "embed",
      options: [
        { label: "Embed-lenke (YouTube/Loom/Vimeo)", value: "embed" },
        { label: "Opplastet video", value: "upload" },
      ],
    },
    {
      name: "url",
      type: "text",
      label: "Video-URL",
      admin: {
        description: "YouTube-, Loom- eller Vimeo-lenke",
        condition: (_, sibling) => sibling?.source !== "upload",
      },
    },
    ...uploadVideoFields((_, sibling) => sibling?.source === "upload"),
    { name: "caption", type: "text", label: "Bildetekst" },
  ],
};
