import type { Block } from "payload";

/** Innebygd video fra YouTube, Loom eller Vimeo. */
export const GuideVideo: Block = {
  slug: "guideVideo",
  interfaceName: "GuideVideoBlock",
  labels: { singular: "Video", plural: "Videoer" },
  fields: [
    {
      name: "url",
      type: "text",
      required: true,
      label: "Video-URL",
      admin: { description: "YouTube-, Loom- eller Vimeo-lenke" },
    },
    { name: "caption", type: "text", label: "Bildetekst" },
  ],
};
