import type { Block } from "payload";

export const FormBlock: Block = {
  slug: "formBlock",
  interfaceName: "FormBlock",
  labels: {
    singular: "Skjema",
    plural: "Skjemaer",
  },
  fields: [
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      required: true,
      label: "Velg skjema",
      admin: {
        description:
          "Velg et skjema du har opprettet. Gå til 'Skjemaer' i menyen for å opprette nye skjemaer.",
      },
    },
    {
      name: "title",
      type: "text",
      label: "Overskrift (valgfritt)",
      admin: {
        description: "Overstyr skjemaets tittel på denne siden",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Beskrivelse (valgfritt)",
      admin: {
        description: "Tekst som vises over skjemaet",
      },
    },
    {
      // Presentasjonsvalg samlet nederst — samme «Utseende»-mønster som de
      // andre blokkene.
      type: "collapsible",
      label: "Utseende",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "variant",
          type: "select",
          label: "Stil",
          defaultValue: "default",
          options: [
            { label: "Standard", value: "default" },
            { label: "Med bakgrunn", value: "card" },
            { label: "Innrammet", value: "bordered" },
          ],
        },
        {
          name: "alignment",
          type: "select",
          label: "Justering",
          defaultValue: "left",
          options: [
            { label: "Venstre", value: "left" },
            { label: "Sentrert", value: "center" },
          ],
        },
        {
          name: "maxWidth",
          type: "select",
          label: "Maks bredde",
          defaultValue: "md",
          options: [
            { label: "Smal (400px)", value: "sm" },
            { label: "Medium (600px)", value: "md" },
            { label: "Bred (800px)", value: "lg" },
            { label: "Full bredde", value: "full" },
          ],
        },
      ],
    },
  ],
};
