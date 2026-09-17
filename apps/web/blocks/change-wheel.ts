import type { Block } from "payload";
import {
  CHANGE_WHEEL_AI_PROMPT,
  changeWheelAreasCms,
} from "../lib/vekst/book-content";
import {
  vekstAppearance,
  vekstHeaderFields,
  vekstLinkFields,
} from "./vekst-fields";

/**
 * Endringshjulet fra boka: områder med ja/nei-spørsmål. Hvert område fylles i
 * rosa, gult eller grønt, og hjulet peker ut hvor leseren bør starte.
 */
export const ChangeWheel: Block = {
  slug: "changeWheel",
  interfaceName: "ChangeWheelBlock",
  admin: {
    custom: {
      description:
        "Endringshjulet fra «Verdifull vekst»: fire områder med tre ja/nei-spørsmål hver. Hjulet farges rosa/gult/grønt og peker ut hvor leseren bør starte. Utelat areas og aiPrompt for bokas innhold.",
    },
  },
  labels: {
    singular: "Endringshjulet (Verdifull vekst)",
    plural: "Endringshjul (Verdifull vekst)",
  },
  fields: [
    ...vekstHeaderFields,
    {
      name: "areas",
      type: "array",
      label: "Områder",
      labels: { singular: "Område", plural: "Områder" },
      minRows: 2,
      maxRows: 8,
      defaultValue: changeWheelAreasCms,
      admin: {
        description:
          "Boka har fire områder med tre spørsmål hver. 0–1 ja blir rosa, 2 ja gult og 3 ja grønt.",
      },
      fields: [
        { name: "name", type: "text", required: true, label: "Område" },
        {
          name: "questions",
          type: "array",
          label: "Ja/nei-spørsmål",
          labels: { singular: "Spørsmål", plural: "Spørsmål" },
          minRows: 1,
          fields: [
            {
              name: "question",
              type: "text",
              required: true,
              label: "Spørsmål",
            },
          ],
        },
        {
          name: "advice",
          type: "textarea",
          label: "Råd: hva bør leseren gjøre med dette området?",
          admin: {
            description:
              "Vises i planen til slutt, uansett hvor sterkt området er. Det svakeste området får «Start her».",
          },
        },
        vekstLinkFields(),
        {
          name: "linkPending",
          type: "checkbox",
          label: "Avvent lenken (verktøyet er ikke klart)",
          admin: {
            description:
              "Rådet vises som vanlig, men lenken byttes ut med «Verktøyet kommer snart». Skru av når verktøyet er klart, så slipper du å skrive lenken på nytt.",
          },
        },
      ],
    },
    {
      name: "aiPrompt",
      type: "textarea",
      label: "Prompt til «Kopier resultatet til KI»",
      defaultValue: CHANGE_WHEEL_AI_PROMPT,
      admin: {
        rows: 8,
        description:
          "{resultat} byttes ut med svarene til leseren. La feltet stå tomt for å skjule knappen.",
      },
    },
    vekstAppearance(),
  ],
};
