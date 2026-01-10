import type { CollectionConfig } from "payload";
import { Hero } from "../blocks/hero";
import { Content } from "../blocks/content";
import { MediaBlock } from "../blocks/media";
import { Archive } from "../blocks/archive";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "Sidetittel",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "URL-slug",
      admin: {
        description: "Bruk 'forside' for forsida",
      },
    },
    {
      name: "layout",
      type: "blocks",
      label: "Sidelayout",
      blocks: [Hero, Content, MediaBlock, Archive],
    },
    {
      name: "meta",
      type: "group",
      label: "SEO Metadata",
      fields: [
        {
          name: "title",
          type: "text",
          label: "Meta Title",
        },
        {
          name: "description",
          type: "textarea",
          label: "Meta Description",
        },
      ],
    },
  ],
};
