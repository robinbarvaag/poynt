import type { Block } from "payload";
import { chapterDoorsCms } from "../lib/vekst/book-content";
import { vekstAppearance, vekstHeaderFields } from "./vekst-fields";

/**
 * Kapittelportalen: én dør per bokstav i VEKST, som leder til verktøyene på
 * siden. Dører leseren har gått gjennom står på gløtt.
 */
export const ChapterPortal: Block = {
  slug: "chapterPortal",
  interfaceName: "ChapterPortalBlock",
  labels: {
    singular: "Kapittelportal (Verdifull vekst)",
    plural: "Kapittelportaler (Verdifull vekst)",
  },
  fields: [
    ...vekstHeaderFields,
    {
      name: "doors",
      type: "array",
      label: "Dører",
      labels: { singular: "Dør", plural: "Dører" },
      minRows: 1,
      maxRows: 8,
      defaultValue: chapterDoorsCms,
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
                description: "Tom = første bokstav i tittelen.",
              },
            },
            {
              name: "title",
              type: "text",
              required: true,
              label: "Tittel",
              admin: { width: "80%" },
            },
          ],
        },
        { name: "text", type: "textarea", label: "Kort tekst" },
        {
          type: "row",
          fields: [
            {
              name: "linkLabel",
              type: "text",
              label: "Lenketekst",
              admin: { width: "50%" },
            },
            {
              name: "href",
              type: "text",
              label: "Lenke",
              admin: {
                width: "50%",
                description:
                  "Et anker på siden (f.eks. #vekst-sjekken) eller en adresse.",
              },
            },
          ],
        },
      ],
    },
    vekstAppearance(),
  ],
};
