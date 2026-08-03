import type { Block } from "payload";

export const BookHero: Block = {
  slug: "bookHero",
  interfaceName: "BookHeroBlock",
  labels: {
    singular: "Bok-hero (lansering)",
    plural: "Bok-heroer",
  },
  fields: [
    {
      name: "badge",
      type: "text",
      label: "Status-pille",
      admin: {
        description:
          "Kort statuslinje øverst med en liten blinkende prikk, f.eks. «Kommer våren 2027».",
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
      label: "Løfter om boka",
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
      label: "Bokomslag",
      admin: {
        description:
          "Stående bilde av omslaget (2:3). Så lenge dette står tomt, vises kapittel-kortet under i stedet – last opp omslaget når det finnes, så tar det over plassen automatisk.",
      },
    },
    {
      name: "chapters",
      type: "array",
      label: "Kapitler",
      admin: {
        description:
          "Vises som et kort der kapitlene byttes ett om gangen. Forbokstavene i kapittelnavnene lyser opp under kortet – velger du navn som staver ut boktittelen (V-E-K-S-T), blir det synlig for leseren. Brukes kun når det ikke er lastet opp et bokomslag.",
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
      ],
    },
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      label: "Påmeldingsskjema",
      admin: {
        description:
          "Skjemaet vises rett i heroen, så leseren kan melde seg på uten å scrolle.",
      },
    },
    {
      name: "note",
      type: "text",
      label: "Liten tekst under skjemaet",
      admin: {
        description:
          "F.eks. hva som skjer videre, eller at man kan melde seg av når som helst.",
      },
    },
  ],
};
