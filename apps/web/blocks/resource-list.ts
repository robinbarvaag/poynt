import type { Block } from "payload";

/**
 * Ressursliste: lenker, filer, bøker, podkaster, musikk, video, verktøy.
 * Én blokk for «her er tingene» – typen på hver rad styrer ikon og bildeform,
 * og kategorien gir filter-brikker når det er flere av dem.
 */
export const ResourceList: Block = {
  slug: "resourceList",
  interfaceName: "ResourceListBlock",
  labels: {
    singular: "Ressursliste (lenker, filer, bøker)",
    plural: "Ressurslister",
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
      name: "items",
      type: "array",
      label: "Ressurser",
      labels: { singular: "Ressurs", plural: "Ressurser" },
      minRows: 1,
      admin: {
        description:
          "Én rad per ting. Bruk «Kategori» til å gruppere (f.eks. «Podkast», «Musikk», «Fokus») – da får leseren filter-brikker over lista.",
      },
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
              name: "kind",
              type: "select",
              required: true,
              label: "Type",
              defaultValue: "link",
              options: [
                { label: "Lenke", value: "link" },
                { label: "Fil (last ned)", value: "file" },
                { label: "Bok", value: "book" },
                { label: "Podkast", value: "podcast" },
                { label: "Musikk / spilleliste", value: "music" },
                { label: "Video", value: "video" },
                { label: "Verktøy", value: "tool" },
                { label: "App", value: "app" },
              ],
              admin: { width: "40%" },
            },
          ],
        },
        { name: "description", type: "textarea", label: "Beskrivelse" },
        {
          name: "url",
          type: "text",
          label: "Lenke",
          admin: {
            description: "Ekstern URL. For filer: last heller opp fila under.",
            condition: (_, siblingData) => siblingData?.kind !== "file",
          },
        },
        {
          name: "file",
          type: "upload",
          relationTo: "media",
          label: "Fil",
          admin: {
            description: "Fila som skal lastes ned (PDF, mal, regneark …).",
            condition: (_, siblingData) => siblingData?.kind === "file",
          },
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Bilde / omslag",
          admin: {
            description:
              "Bokomslag (stående), podkast-cover (kvadrat) eller et skjermbilde (liggende). Valgfritt – uten bilde vises et ikon.",
          },
        },
        {
          type: "row",
          fields: [
            {
              name: "category",
              type: "text",
              label: "Kategori",
              admin: {
                description: "Fri tekst. Lik stavemåte = samme filter-brikke.",
                width: "50%",
              },
            },
            {
              name: "note",
              type: "text",
              label: "Liten tilleggstekst",
              admin: {
                description: "Forfatter, «anbefalt av …», varighet.",
                width: "50%",
              },
            },
          ],
        },
      ],
    },
    {
      // Presentasjonsvalg samlet nederst (kun visning — samme feltnavn/skjema).
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "layout",
              type: "select",
              label: "Visning",
              defaultValue: "grid",
              options: [
                { label: "Kort med bilde", value: "grid" },
                { label: "Kompakt liste", value: "list" },
              ],
              admin: { width: "50%" },
            },
            {
              name: "columns",
              type: "select",
              label: "Antall kolonner (kort)",
              defaultValue: "3",
              options: [
                { label: "2", value: "2" },
                { label: "3", value: "3" },
                { label: "4", value: "4" },
              ],
              admin: {
                width: "50%",
                condition: (_, siblingData) => siblingData?.layout !== "list",
              },
            },
          ],
        },
        {
          name: "showFilter",
          type: "select",
          label: "Filter-brikker",
          defaultValue: "auto",
          options: [
            {
              label: "Automatisk (når det er flere kategorier)",
              value: "auto",
            },
            { label: "Alltid", value: "always" },
            { label: "Aldri", value: "never" },
          ],
        },
      ],
    },
  ],
};
