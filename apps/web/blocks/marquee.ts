import type { Block } from "payload";

export const MarqueeBlock: Block = {
  slug: "marquee",
  interfaceName: "MarqueeBlock",
  labels: {
    singular: "Rullende tekstbånd",
    plural: "Rullende tekstbånd",
  },
  fields: [
    {
      name: "items",
      type: "array",
      required: true,
      minRows: 1,
      label: "Ord som ruller",
      admin: {
        description:
          "Korte ord eller uttrykk. De gjentas i en uendelig løkke, så 3–6 stykker holder.",
      },
      fields: [{ name: "text", type: "text", required: true, label: "Tekst" }],
    },
    {
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "surface",
          type: "select",
          label: "Bånd-farge",
          defaultValue: "primary",
          options: [
            { label: "Grønn", value: "primary" },
            { label: "Aksent 1 (cream)", value: "saffron" },
            { label: "Aksent 2 (rosa)", value: "salmon" },
            { label: "Aksent 3 (mint)", value: "mint" },
            { label: "Kun streker", value: "outline" },
          ],
        },
        {
          name: "speed",
          type: "select",
          label: "Fart",
          defaultValue: "base",
          options: [
            { label: "Rolig", value: "slow" },
            { label: "Normal", value: "base" },
            { label: "Rask", value: "fast" },
          ],
        },
        {
          name: "reverse",
          type: "checkbox",
          defaultValue: false,
          label: "Rull mot høyre",
        },
        {
          name: "tilt",
          type: "checkbox",
          defaultValue: true,
          label: "Skjevstilt bånd",
          admin: {
            description: "Litt på skrå, som en plakat-stripe.",
          },
        },
      ],
    },
  ],
};
