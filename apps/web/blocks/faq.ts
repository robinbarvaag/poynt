import type { Block } from "payload";

export const Faq: Block = {
  slug: "faq",
  interfaceName: "FaqBlock",
  labels: { singular: "FAQ (ofte stilte spørsmål)", plural: "FAQ" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", label: "Tittel" },
    { name: "intro", type: "textarea", label: "Ingress" },
    {
      name: "items",
      type: "array",
      label: "Spørsmål",
      labels: { singular: "Spørsmål", plural: "Spørsmål" },
      minRows: 1,
      fields: [
        { name: "question", type: "text", required: true, label: "Spørsmål" },
        { name: "answer", type: "textarea", required: true, label: "Svar" },
      ],
    },
  ],
};
