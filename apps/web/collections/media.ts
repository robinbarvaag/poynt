import {
  generateBlurDataURL,
  supportsBlurPlaceholder,
} from "@/lib/blur-data-url";
import type { CollectionConfig } from "payload";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

export const Media: CollectionConfig = {
  slug: "media",
  folders: true,
  hooks: {
    beforeChange: [
      // Lager en base64 blur-plassholder (LQIP) når en ny bildefil lastes opp.
      // Rene metadata-endringer (req.file mangler) beholder eksisterende verdi.
      async ({ data, req }) => {
        const file = req.file;
        if (!file?.data || !supportsBlurPlaceholder(file.mimetype)) {
          return data;
        }
        const blurDataURL = await generateBlurDataURL(file.data);
        return blurDataURL ? { ...data, blurDataURL } : data;
      },
    ],
    afterChange: [revalidateCmsAfterChange],
    afterDelete: [revalidateCmsAfterDelete],
  },
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
      // Delingsbilde for sosiale medier: plattformene forventer 1,91:1
      // (1200×630). Beskjæringen respekterer fokuspunktet, og jpeg-komprimering
      // holder filen langt under 1 MB-grensen previews liker.
      {
        name: "og",
        width: 1200,
        height: 630,
        position: "centre",
        formatOptions: { format: "jpeg", options: { quality: 80 } },
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
    // Base64 LQIP generert av beforeChange-hooken over. Leses av
    // `<PayloadImage>` (placeholder="blur"). Skjult i admin — ren base64-grøt.
    {
      name: "blurDataURL",
      type: "text",
      admin: {
        hidden: true,
      },
    },
    {
      name: "isPrivate",
      type: "checkbox",
      label: "Privat bilde",
      defaultValue: false,
      admin: {
        // Ærlig beskrivelse: fila ligger på offentlig blob-lagring, så vi kan
        // bare skjule den i lister/API — ikke gjøre selve fila hemmelig.
        description:
          "Skjules i offentlige lister og søk. NB: selve bildefila kan fortsatt åpnes av alle som har direktelenken — ikke last opp noe konfidensielt.",
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
