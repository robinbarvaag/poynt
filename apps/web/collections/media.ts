import {
  generateBlurDataURL,
  supportsBlurPlaceholder,
} from "@/lib/blur-data-url";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/media-limits";
import { toRelativeMediaUrl } from "@/lib/media-url";
import { APIError, type CollectionConfig } from "payload";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

export const Media: CollectionConfig = {
  slug: "media",
  folders: true,
  hooks: {
    beforeOperation: [
      // Størrelsesgrense for Blob-stien. Med clientUploads går fila utenom
      // multipart-parseren (og dermed `upload.limits`), så vi sjekker her, rett
      // etter at Payload har hentet fila tilbake fra Blob og før sharp kjører.
      ({ req, operation }) => {
        if (operation !== "create" && operation !== "update") return;
        const file = req.file;
        if (!file) return;
        const size = file.size || file.data?.byteLength || 0;
        if (size > MAX_UPLOAD_BYTES) {
          throw new APIError(
            `Fila er for stor (${(size / 1024 / 1024).toFixed(1)} MB). Maks ${MAX_UPLOAD_LABEL} per opplasting.`,
            400
          );
        }
      },
    ],
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
    // Blob-pluginen lagrer absolutte URL-er med serverURL fra opplastings-
    // øyeblikket (lokalt = http://localhost:3000). Admin bruker verdien rått,
    // så vi normaliserer til host-relative stier ved lesing — de virker på
    // alle domener. Migrasjonen 20260829_150000 rettet eksisterende rader.
    afterRead: [
      ({ doc }) => {
        if (typeof doc.url === "string") doc.url = toRelativeMediaUrl(doc.url);
        if (typeof doc.thumbnailURL === "string") {
          doc.thumbnailURL = toRelativeMediaUrl(doc.thumbnailURL);
        }
        if (doc.sizes && typeof doc.sizes === "object") {
          for (const size of Object.values(doc.sizes) as Array<{
            url?: string | null;
          }>) {
            if (size && typeof size.url === "string") {
              size.url = toRelativeMediaUrl(size.url);
            }
          }
        }
        return doc;
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
      // Leveringskilde for frontend: <PayloadImage> bruker denne i stedet for
      // originalen når den finnes. Begrenset bredde + webp gir Next sin
      // image-optimizer en liten kilde å jobbe fra, uansett hvor stor jpeg-en
      // redaktøren lastet opp. `withoutEnlargement: true` gjør at også bilder
      // smalere enn 2400 px får en webp-variant (i originalstørrelse) i stedet
      // for å hoppes over. Originalen lagres urørt (se clientUploads-notatet i
      // payload.config.ts). Ikke brukt for svg/video/pdf — sharp hopper over.
      {
        name: "large",
        width: 2400,
        height: undefined,
        position: "centre",
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
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
