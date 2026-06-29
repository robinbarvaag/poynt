import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  folders: true,
  admin: {
    group: "Innhold",
    components: {
      // «Finn bilde»-knapp over media-lista: søk i Unsplash/Giphy og importér.
      beforeListTable: [
        "/admin/components/media/stock-picker#StockMediaPicker",
      ],
    },
  },
  access: {
    read: ({ req: { user } }) => {
      // Innloggede brukere kan se alt
      if (user) return true;
      // Anonyme brukere kan bare se public bilder
      return {
        isPrivate: {
          not_equals: true,
        },
      };
    },
  },
  upload: {
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: 1024,
        position: "centre",
      },
      {
        name: "tablet",
        width: 1024,
        height: undefined,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*", "video/*", "application/pdf"],
  },
  fields: [
    // «Finn bilde»-knapp øverst i skjemaet, så den også er tilgjengelig når man
    // oppretter et nytt media (inkl. «Opprett ny» fra et bildefelt), ikke bare
    // over media-lista.
    {
      name: "stockPicker",
      type: "ui",
      admin: {
        components: {
          Field: "/admin/components/media/stock-picker#StockMediaPicker",
        },
      },
    },
    {
      name: "alt",
      type: "text",
      label: "Alt-tekst",
      admin: {
        description:
          "Beskrivelse av bildet for skjermlesere og SEO. Bruk «Generer alt-tekst» for et AI-forslag du kan justere.",
        components: {
          afterInput: [
            "/admin/components/media/generate-alt-button#GenerateAltButton",
          ],
        },
      },
    },
    {
      name: "isPrivate",
      type: "checkbox",
      label: "Privat bilde",
      defaultValue: false,
      admin: {
        description: "Kun synlig for innloggede brukere",
        position: "sidebar",
      },
    },
    // Kilde-/krediteringsfelt fylles automatisk når bildet importeres fra
    // Pexels/Giphy (se admin/actions/stock-media.ts). Tomme for opplastede
    // bilder.
    {
      name: "source",
      type: "text",
      label: "Kilde",
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Hvor bildet kom fra (pexels / giphy / opplastet).",
      },
    },
    {
      name: "creditLine",
      type: "text",
      label: "Kreditering",
      admin: {
        position: "sidebar",
        description: "Vises som bildekreditering, f.eks. «Foto: … / Unsplash».",
      },
    },
    {
      name: "sourceUrl",
      type: "text",
      label: "Kilde-URL",
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Lenke til originalen hos kilden.",
      },
    },
  ],
};
