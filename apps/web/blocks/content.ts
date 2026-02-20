import type { Block } from "payload";

export const Content: Block = {
  slug: "content",
  interfaceName: "ContentBlock",
  labels: {
    singular: "Innholdsblokk",
    plural: "Innholdsblokker",
  },
  fields: [
    {
      name: "richText",
      type: "richText",
      required: true,
      label: "Innhold",
    },
  ],
};
