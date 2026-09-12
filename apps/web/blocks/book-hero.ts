import type { Block } from "payload";

/**
 * Hero med et «objekt» ved siden av teksten: et bokomslag i 3D, eller et
 * kort som blar gjennom kapitler/temaer ett om gangen. Laget for lanseringa
 * av «Verdifull vekst», men ikke bundet til bøker — kortet fungerer like godt
 * som innholdsfortegnelse på en ressursside (kapitlene lenker til seksjoner)
 * eller som teaser for et kurs (modulene blar forbi).
 */
export const BookHero: Block = {
  slug: "bookHero",
  interfaceName: "BookHeroBlock",
  labels: {
    singular: "Objekt-hero (bok / kort)",
    plural: "Objekt-heroer",
  },
  fields: [
    {
      name: "badge",
      type: "text",
      label: "Status-pille",
      admin: {
        description:
          "Kort statuslinje øverst med en liten prikk, f.eks. «Kommer våren 2027» eller «Oppdatert september 2026».",
      },
    },
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", required: true, label: "Tittel" },
    { name: "subtitle", type: "textarea", label: "Undertekst" },
    {
      name: "bullets",
      type: "array",
      label: "Løfter / punkter",
      admin: {
        description:
          "Korte punkter om hva leseren sitter igjen med. Hold dem på én linje hver.",
      },
      fields: [{ name: "text", type: "text", required: true, label: "Punkt" }],
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: "Bilde (omslag / kort)",
      admin: {
        description:
          "Stående bilde (2:3 for bok). Så lenge dette står tomt, vises kapittel-kortet under i stedet – last opp bildet når det finnes, så tar det over plassen automatisk.",
      },
    },
    {
      name: "chapters",
      type: "array",
      label: "Kapitler / temaer",
      admin: {
        description:
          "Vises som et kort der kapitlene byttes ett om gangen. Med brikketype «Forbokstaver» lyser forbokstavene opp under kortet – velger du navn som staver ut et ord (V-E-K-S-T), blir det synlig for leseren. Gi hvert kapittel en lenke (f.eks. #prompter) så blir kortet en innholdsfortegnelse. Brukes kun når det ikke er lastet opp et bilde.",
        condition: (_, siblingData) => !siblingData?.cover,
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          label: "Kapittelnavn",
          admin: {
            description:
              "Ett ord fungerer best – første bokstav blir den store bokstaven på kortet.",
          },
        },
        {
          name: "text",
          type: "textarea",
          label: "Én setning om kapittelet",
        },
        {
          type: "row",
          fields: [
            {
              name: "href",
              type: "text",
              label: "Lenke (valgfri)",
              admin: {
                description:
                  "F.eks. «#prompter» for å hoppe til en seksjon på samme side (blokk-navnet på seksjonen blir ankeret).",
                width: "60%",
              },
            },
            {
              name: "linkLabel",
              type: "text",
              label: "Lenketekst",
              admin: { description: "Standard «Gå til».", width: "40%" },
            },
          ],
        },
      ],
    },
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      label: "Påmeldingsskjema",
      admin: {
        description:
          "Skjemaet vises rett i heroen, så leseren kan melde seg på uten å scrolle. Uten skjema vises knappene under i stedet.",
      },
    },
    {
      name: "primaryCta",
      type: "group",
      label: "Primær knapp (når det ikke er skjema)",
      admin: { condition: (_, siblingData) => !siblingData?.form },
      fields: [
        { name: "text", type: "text", label: "Knappetekst" },
        {
          name: "url",
          type: "text",
          label: "Lenke",
          admin: { description: "URL eller #anker på samme side." },
        },
      ],
    },
    {
      name: "secondaryCta",
      type: "group",
      label: "Sekundær knapp",
      admin: { condition: (_, siblingData) => !siblingData?.form },
      fields: [
        { name: "text", type: "text", label: "Knappetekst" },
        { name: "url", type: "text", label: "Lenke" },
      ],
    },
    {
      name: "note",
      type: "text",
      label: "Liten tekst under skjemaet / knappene",
      admin: {
        description:
          "F.eks. hva som skjer videre, eller at man kan melde seg av når som helst.",
      },
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
              name: "figureSide",
              type: "select",
              label: "Objektet står",
              defaultValue: "right",
              options: [
                { label: "Til høyre", value: "right" },
                { label: "Til venstre", value: "left" },
              ],
              admin: { width: "50%" },
            },
            {
              name: "figureAspect",
              type: "select",
              label: "Form",
              defaultValue: "book",
              options: [
                { label: "Bok (2:3, med rygg)", value: "book" },
                { label: "Kort (4:5)", value: "card" },
                { label: "Kvadrat", value: "square" },
              ],
              admin: { width: "50%" },
            },
          ],
        },
        {
          name: "palette",
          type: "select",
          label: "Farger på kortet",
          defaultValue: "book",
          options: [
            { label: "Boka «Verdifull vekst» (lilla/oliven)", value: "book" },
            { label: "Poynt (grønn)", value: "poynt" },
            { label: "Egne farger", value: "custom" },
          ],
          admin: {
            description:
              "Gjelder kapittel-kortet. Et produkt med egen identitet bør ha sine egne farger her – ikke Poynt-grønt.",
          },
        },
        {
          name: "customPalette",
          type: "group",
          label: "Egne farger",
          admin: {
            condition: (_, siblingData) => siblingData?.palette === "custom",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "surface",
                  type: "text",
                  label: "Flate",
                  defaultValue: "#cdc1da",
                  admin: { description: "Hex, f.eks. #cdc1da", width: "33%" },
                },
                {
                  name: "ink",
                  type: "text",
                  label: "Tekst",
                  defaultValue: "#33174a",
                  admin: { width: "33%" },
                },
                {
                  name: "accent",
                  type: "text",
                  label: "Aksent (aktiv brikke)",
                  defaultValue: "#cbcd8e",
                  admin: { width: "33%" },
                },
              ],
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "rotatorEyebrow",
              type: "text",
              label: "Etikett øverst på kortet",
              admin: {
                description: "Standard «Kapitlene i boka».",
                width: "50%",
              },
            },
            {
              name: "rotatorMarkers",
              type: "select",
              label: "Brikker under kortet",
              defaultValue: "initials",
              options: [
                { label: "Forbokstaver (akrostikon)", value: "initials" },
                { label: "Tall", value: "numbers" },
                { label: "Prikker", value: "dots" },
              ],
              admin: { width: "50%" },
            },
          ],
        },
        {
          name: "rotatorInterval",
          type: "number",
          label: "Sekunder per kapittel",
          defaultValue: 4,
          min: 2,
          max: 20,
          admin: {
            description: "Hvor lenge hvert kapittel står før kortet blar.",
          },
        },
        {
          name: "shapes",
          type: "select",
          label: "Fargeflekker i bakgrunnen",
          defaultValue: "subtle",
          options: [
            { label: "Svake", value: "subtle" },
            { label: "Tydelige", value: "default" },
            { label: "Ingen", value: "none" },
          ],
        },
      ],
    },
  ],
};
