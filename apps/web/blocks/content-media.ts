import type { Block } from "payload";

export const ContentMedia: Block = {
  slug: "contentMedia",
  interfaceName: "ContentMediaBlock",
  labels: { singular: "Tekst + media", plural: "Tekst + media" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", required: true, label: "Tittel" },
    { name: "body", type: "textarea", label: "Tekst" },
    {
      name: "bullets",
      type: "array",
      label: "Punkter",
      labels: { singular: "Punkt", plural: "Punkter" },
      fields: [{ name: "text", type: "text", required: true, label: "Tekst" }],
    },
    { name: "ctaText", type: "text", label: "Knappetekst" },
    { name: "ctaUrl", type: "text", label: "Knappe-URL" },
    { name: "image", type: "upload", relationTo: "media", label: "Bilde" },
    {
      name: "mediaSide",
      type: "select",
      label: "Hvilken side bildet ligger på",
      defaultValue: "right",
      options: [
        { label: "Høyre", value: "right" },
        { label: "Venstre", value: "left" },
      ],
    },
    {
      name: "accent",
      type: "select",
      label: "Aksentfarge (marker + blokk bak bildet)",
      defaultValue: "saffron",
      options: [
        { label: "Saffron", value: "saffron" },
        { label: "Salmon", value: "salmon" },
        { label: "Grønn", value: "primary" },
        { label: "Mint", value: "mint" },
      ],
    },
  ],
};
