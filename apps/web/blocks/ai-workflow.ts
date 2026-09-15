import type { Block } from "payload";
import { workflowsCms } from "../lib/vekst/book-content";
import { vekstAppearance, vekstHeaderFields } from "./vekst-fields";

/**
 * Arbeidsflyter med KI: input → prompt → resultat, med et forhåndsskrevet
 * eksempel som «kjøres» på siden og knapper for å åpne prompten i ChatGPT
 * eller Claude.
 */
export const AiWorkflow: Block = {
  slug: "aiWorkflow",
  interfaceName: "AiWorkflowBlock",
  labels: {
    singular: "Arbeidsflyter med KI (Verdifull vekst)",
    plural: "Arbeidsflyter med KI (Verdifull vekst)",
  },
  fields: [
    ...vekstHeaderFields,
    {
      name: "workflows",
      type: "array",
      label: "Arbeidsflyter",
      labels: { singular: "Arbeidsflyt", plural: "Arbeidsflyter" },
      minRows: 1,
      defaultValue: workflowsCms,
      fields: [
        { name: "title", type: "text", required: true, label: "Tittel" },
        { name: "description", type: "textarea", label: "Kort forklaring" },
        {
          type: "row",
          fields: [
            {
              name: "inputLabel",
              type: "text",
              label: "Hva leseren gir",
              admin: {
                width: "40%",
                description: "F.eks. «Talememo fra turen».",
              },
            },
            {
              name: "inputIcon",
              type: "select",
              label: "Ikon",
              defaultValue: "file-text",
              options: [
                { label: "Mikrofon", value: "mic" },
                { label: "Dokument", value: "file-text" },
                { label: "Personer", value: "users" },
                { label: "Søk", value: "search" },
                { label: "Bilde", value: "image" },
                { label: "Lyspære", value: "lightbulb" },
              ],
              admin: { width: "20%" },
            },
            {
              name: "outputLabel",
              type: "text",
              label: "Hva leseren får",
              admin: {
                width: "40%",
                description: "F.eks. «Tre prioriteringer».",
              },
            },
          ],
        },
        {
          name: "prompt",
          type: "textarea",
          required: true,
          label: "Prompt",
          admin: {
            rows: 8,
            description:
              "Akkurat slik den skal limes inn. Bruk [klammer] for det leseren skal bytte ut.",
          },
        },
        {
          name: "exampleOutput",
          type: "textarea",
          label: "Eksempel på svar",
          admin: {
            rows: 6,
            description:
              "Vises og «skrives ut» når leseren trykker «Kjør eksempelet». Ingen KI kalles på siden.",
          },
        },
        {
          name: "style",
          type: "select",
          label: "Vis svaret som",
          defaultValue: "standard",
          options: [
            { label: "Tekst", value: "standard" },
            {
              label: "Chatbobler (én per «Navn: tekst»-linje)",
              value: "board",
            },
          ],
        },
      ],
    },
    vekstAppearance(),
  ],
};
