import type { Block } from "payload";
import { mythsCms } from "../lib/vekst/book-content";
import {
  vekstAppearance,
  vekstHeaderFields,
  vekstLinkFields,
} from "./vekst-fields";

/** Løgner som hindrer vekst, som vendekort: løgnen foran, sannheten bak. */
export const MythCards: Block = {
  slug: "mythCards",
  interfaceName: "MythCardsBlock",
  admin: {
    custom: {
      description:
        "Vendekort med «Ti løgner som kan hindre vekst» fra boka: løgnen foran, sannheten bak, teller og konfetti når alle er snudd. Utelat myths for bokas ti.",
    },
  },
  labels: {
    singular: "Løgner som vendekort (Verdifull vekst)",
    plural: "Løgner som vendekort (Verdifull vekst)",
  },
  fields: [
    ...vekstHeaderFields,
    {
      name: "myths",
      type: "array",
      label: "Løgner",
      labels: { singular: "Løgn", plural: "Løgner" },
      minRows: 1,
      defaultValue: mythsCms,
      fields: [
        { name: "lie", type: "text", required: true, label: "Løgnen" },
        {
          name: "truth",
          type: "textarea",
          required: true,
          label: "Sannheten (baksiden av kortet)",
        },
      ],
    },
    vekstLinkFields("Vises når leseren har snudd alle kortene."),
    vekstAppearance(),
  ],
};
