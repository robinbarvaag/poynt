import type { Block } from "payload";
import { uploadVideoFields } from "./guide-blocks/_shared";

// «Historie»-blokkene på produktsiden: fri rekkefølge og valgfritt innhold
// per produkt – tekst, bakside, sitater, PDF-smakebit og video.

export const StoryText: Block = {
  slug: "storyText",
  interfaceName: "ProductStoryTextBlock",
  labels: { singular: "Tekst", plural: "Tekst" },
  fields: [
    {
      name: "heading",
      type: "text",
      label: "Overskrift (valgfri)",
    },
    {
      name: "text",
      type: "textarea",
      required: true,
      label: "Tekst",
      admin: {
        description: "Vises som sentrert ingress mellom seksjonene",
      },
    },
  ],
};

export const StoryBackCover: Block = {
  slug: "storyBackCover",
  interfaceName: "ProductStoryBackCoverBlock",
  labels: { singular: "Bakside", plural: "Baksider" },
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Bilde av baksiden",
      admin: {
        description:
          "Gjerne et helt vanlig foto – litt skjevt og ekte er hele poenget 📸",
      },
    },
    {
      name: "text",
      type: "textarea",
      label: "Baksidetekst",
      admin: {
        description:
          "Teksten som blir lagt oppå bildet som en håndskrevet lapp",
      },
    },
    {
      name: "note",
      type: "text",
      label: "Liten kommentar (valgfri)",
      admin: {
        description:
          "Morsom liten bildetekst under, f.eks. «Ja, dette er faktisk baksiden av boka»",
      },
    },
  ],
};

export const StoryQuotes: Block = {
  slug: "storyQuotes",
  interfaceName: "ProductStoryQuotesBlock",
  labels: { singular: "Sitater", plural: "Sitater" },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Overskrift",
      defaultValue: "Fra leserne",
    },
    {
      name: "quotes",
      type: "array",
      label: "Sitater",
      labels: { singular: "Sitat", plural: "Sitater" },
      minRows: 1,
      fields: [
        {
          name: "quote",
          type: "textarea",
          required: true,
          label: "Sitat",
        },
        {
          name: "name",
          type: "text",
          label: "Navn",
        },
        {
          name: "detail",
          type: "text",
          label: "Detalj",
          admin: {
            description: "F.eks. «mamma til to» eller «lærer i barneskolen»",
          },
        },
      ],
    },
  ],
};

export const StoryPdf: Block = {
  slug: "storyPdf",
  interfaceName: "ProductStoryPdfBlock",
  labels: { singular: "Smakebit (PDF)", plural: "Smakebiter (PDF)" },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Overskrift",
      defaultValue: "Ta en titt inni",
    },
    {
      name: "intro",
      type: "textarea",
      label: "Ingress",
      admin: {
        description:
          "Kort tekst over PDF-visningen, f.eks. «Bla gjennom innledningen, innholdslisten og et par sider»",
      },
    },
    {
      name: "file",
      type: "upload",
      relationTo: "media",
      label: "PDF-fil",
      filterOptions: {
        mimeType: { contains: "pdf" },
      },
    },
  ],
};

export const StoryVideo: Block = {
  slug: "storyVideo",
  interfaceName: "ProductStoryVideoBlock",
  labels: { singular: "Video", plural: "Videoer" },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Overskrift",
      defaultValue: "Se og hør",
    },
    {
      name: "intro",
      type: "textarea",
      label: "Ingress",
      admin: {
        description: "Valgfri kort tekst under overskriften",
      },
    },
    {
      name: "videos",
      type: "array",
      label: "Videoer",
      labels: { singular: "Video", plural: "Videoer" },
      minRows: 1,
      fields: [
        {
          name: "title",
          type: "text",
          label: "Tittel (valgfri)",
        },
        {
          name: "source",
          type: "select",
          label: "Kilde",
          defaultValue: "embed",
          options: [
            { label: "Lenke (YouTube/Vimeo)", value: "embed" },
            { label: "Opplastet fil", value: "upload" },
          ],
        },
        {
          name: "embedUrl",
          type: "text",
          label: "Videolenke",
          admin: {
            description: "YouTube-, Vimeo- eller Loom-lenke",
            condition: (_data, sibling) => sibling?.source !== "upload",
          },
        },
        ...uploadVideoFields((_data, sibling) => sibling?.source === "upload"),
      ],
    },
  ],
};

export const productStoryBlocks: Block[] = [
  StoryText,
  StoryBackCover,
  StoryQuotes,
  StoryPdf,
  StoryVideo,
];
