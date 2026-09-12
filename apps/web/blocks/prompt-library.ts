import type { Block } from "payload";

/**
 * Prompt-bibliotek: ferdige prompter leseren kopierer med ett trykk. Bygd
 * for ressurssider («KI-tips») – hvert kort har tittel, når den er nyttig,
 * og selve prompten i en kopierbar flate.
 */
export const PromptLibrary: Block = {
  slug: "promptLibrary",
  interfaceName: "PromptLibraryBlock",
  labels: {
    singular: "Prompt-bibliotek",
    plural: "Prompt-biblioteker",
  },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", label: "Tittel" },
    { name: "intro", type: "textarea", label: "Ingress" },
    {
      name: "prompts",
      type: "array",
      label: "Prompter",
      labels: { singular: "Prompt", plural: "Prompter" },
      minRows: 1,
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Tittel",
              admin: { width: "60%" },
            },
            {
              name: "tool",
              type: "select",
              label: "Verktøy",
              options: [
                { label: "ChatGPT", value: "ChatGPT" },
                { label: "Claude", value: "Claude" },
                { label: "Gemini", value: "Gemini" },
                { label: "Copilot", value: "Copilot" },
                { label: "Midjourney", value: "Midjourney" },
                { label: "Alle KI-verktøy", value: "Alle KI-verktøy" },
              ],
              admin: {
                description: "Valgfritt – vises som en liten merkelapp.",
                width: "40%",
              },
            },
          ],
        },
        {
          name: "description",
          type: "textarea",
          label: "Når er den nyttig?",
          admin: {
            description: "Én–to setninger om hva prompten hjelper deg med.",
          },
        },
        {
          name: "prompt",
          type: "textarea",
          required: true,
          label: "Prompt",
          admin: {
            description:
              "Akkurat slik den skal limes inn. Linjeskift bevares. Bruk [klammer] for det leseren skal bytte ut, f.eks. [bedriftsnavn].",
            rows: 8,
          },
        },
        {
          name: "tags",
          type: "text",
          label: "Stikkord",
          admin: {
            description: "Komma-separert, f.eks. «salg, e-post».",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "columns",
          type: "select",
          label: "Antall kolonner",
          defaultValue: "2",
          options: [
            { label: "1", value: "1" },
            { label: "2", value: "2" },
            { label: "3", value: "3" },
          ],
        },
      ],
    },
  ],
};
