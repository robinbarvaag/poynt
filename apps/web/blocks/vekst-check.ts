import type { Block } from "payload";
import { vekstPillarsCms } from "../lib/vekst/book-content";
import {
  vekstAppearance,
  vekstHeaderFields,
  vekstLinkFields,
} from "./vekst-fields";

/**
 * VEKST-sjekken: ja/nei-spørsmål per pilar i VEKST-modellen. Bokstavene fylles
 * opp for hvert ja, og leseren får vite hvor de bør starte.
 */
export const VekstCheck: Block = {
  slug: "vekstCheck",
  interfaceName: "VekstCheckBlock",
  labels: {
    singular: "VEKST-sjekken (Verdifull vekst)",
    plural: "VEKST-sjekker (Verdifull vekst)",
  },
  fields: [
    ...vekstHeaderFields,
    {
      name: "pillars",
      type: "array",
      label: "Bokstaver",
      labels: { singular: "Bokstav", plural: "Bokstaver" },
      minRows: 2,
      maxRows: 8,
      defaultValue: vekstPillarsCms,
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "letter",
              type: "text",
              label: "Bokstav",
              maxLength: 2,
              admin: {
                width: "20%",
                description: "Tom = første bokstav i navnet.",
              },
            },
            {
              name: "name",
              type: "text",
              required: true,
              label: "Navn",
              admin: { width: "80%" },
            },
          ],
        },
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
          label: "Råd når dette er svakest",
        },
        vekstLinkFields(),
      ],
    },
    vekstAppearance(),
  ],
};
