import type { Field } from "payload";

/**
 * Opplastings- og avspillingsfelt for selv-hostet video, delt mellom Video-
 * blokken og Kolonner-blokkens video-kolonne. `condition` styrer når feltene
 * vises (de hører til ulike søsken-felt i de to blokkene).
 */
export function uploadVideoFields(
  condition: (data: unknown, sibling: Record<string, unknown>) => boolean
): Field[] {
  return [
    {
      name: "videoFile",
      type: "upload",
      relationTo: "media",
      label: "Videofil",
      admin: {
        description: "Last opp en MP4- eller WebM-fil.",
        condition,
      },
    },
    {
      name: "poster",
      type: "upload",
      relationTo: "media",
      label: "Plakatbilde",
      admin: {
        description: "Stillbilde som vises før avspilling starter (valgfri).",
        condition,
      },
    },
    {
      name: "autoplay",
      type: "checkbox",
      label: "Spill av automatisk",
      defaultValue: false,
      admin: {
        description: "Starter når videoen kommer i visning. Krever «Uten lyd».",
        condition,
      },
    },
    {
      name: "muted",
      type: "checkbox",
      label: "Uten lyd",
      defaultValue: false,
      admin: { condition },
    },
    {
      name: "loop",
      type: "checkbox",
      label: "Spill i loop",
      defaultValue: false,
      admin: { condition },
    },
    {
      name: "showControls",
      type: "checkbox",
      label: "Vis kontroller",
      defaultValue: true,
      admin: {
        description:
          "Skru av for en stille bakgrunns-/loop-video uten avspillerknapper.",
        condition,
      },
    },
  ];
}

/**
 * Valgfri seksjonsoverskrift som hører til selve blokken. Lar redaktøren
 * gruppere innhold visuelt (tittel + kort ingress over boksen) i stedet for
 * å legge en løs heading-blokk rett over – som lett blir foreldreløs og ser
 * rotete ut. Spres inn øverst i container-blokkenes `fields`.
 */
export const sectionHeaderFields: Field[] = [
  {
    name: "title",
    type: "text",
    label: "Overskrift (valgfri)",
    admin: {
      description: "Vises som tittel over innholdet i denne blokken.",
    },
  },
  {
    name: "intro",
    type: "textarea",
    label: "Ingress (valgfri)",
    admin: {
      description: "Kort tekst rett under overskriften.",
    },
  },
];
