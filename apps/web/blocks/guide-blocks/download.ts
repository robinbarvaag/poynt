import type { Block } from "payload";
import { sectionHeaderFields } from "./_shared";

/** Nedlastbare ressurser / gratis filer. */
export const GuideDownload: Block = {
  slug: "guideDownload",
  interfaceName: "GuideDownloadBlock",
  labels: { singular: "Nedlastinger", plural: "Nedlastinger" },
  fields: [
    ...sectionHeaderFields,
    {
      name: "items",
      type: "array",
      label: "Ressurser",
      labels: { singular: "Ressurs", plural: "Ressurser" },
      minRows: 1,
      fields: [
        { name: "title", type: "text", required: true, label: "Tittel" },
        { name: "description", type: "textarea", label: "Beskrivelse" },
        {
          name: "kind",
          type: "select",
          label: "Type",
          defaultValue: "pdf",
          options: [
            { label: "PDF", value: "pdf" },
            { label: "Canva-mal", value: "canva" },
            { label: "Lenke", value: "link" },
            { label: "Annet", value: "other" },
          ],
        },
        {
          name: "file",
          type: "upload",
          relationTo: "media",
          label: "Fil",
          admin: { description: "Last opp fila som skal lastes ned" },
        },
        {
          name: "url",
          type: "text",
          label: "Ekstern lenke (om ikke fil)",
        },
      ],
    },
  ],
};
