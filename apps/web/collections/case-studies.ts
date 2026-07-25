import type { CollectionConfig } from "payload";
import {
  qualityDataFields,
  qualityReviewPanel,
} from "../fields/quality-review";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

/**
 * Kundehistorier — EGEN innholdstype, ikke blogginnlegg. Historiene er
 * tidløst salgsbevis (/kundehistorier/[slug]), mens bloggen er fag og
 * aktualitet. Skjemaet er bevisst strukturert som malen for en god
 * kundehistorie: utfordringen → hva vi gjorde → resultatet, med tall og
 * sitat — så strukturen kommer gratis når partneren skriver.
 */
export const CaseStudies: CollectionConfig = {
  slug: "case-studies",
  labels: {
    singular: "Kundehistorie",
    plural: "Kundehistorier",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "customer", "qualityScore", "updatedAt"],
    group: "Innhold",
    description:
      "Tidløst salgsbevis om ÉN kunde: utfordringen → hva vi gjorde → resultatet. Vises på /kundehistorier og lenkes fra salgssidene. Fagstoff, tips og nyheter hører hjemme i Blogginnlegg.",
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/kundehistorier/${data?.slug}`,
    },
    preview: (doc) =>
      doc?.slug
        ? `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/kundehistorier/${doc.slug}`
        : null,
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = generateSlug(data.title);
        }
        return data;
      },
    ],
    afterChange: [revalidateCmsAfterChange],
    afterDelete: [revalidateCmsAfterDelete],
  },
  fields: [
    {
      // Visuell skrivehjelp øverst: buen, live sjekkliste og Hageland-eksempel.
      name: "retningslinjer",
      type: "ui",
      admin: {
        components: {
          Field: "/admin/components/content-guidelines#ContentGuidelines",
        },
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
      label: "Tittel",
      admin: {
        description:
          "Si resultatet, ikke bare navnet – f.eks. «Hageland Edens Have nådde målene sine».",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "URL-slug",
      admin: {
        position: "sidebar",
        description: "Genereres automatisk fra tittel",
      },
    },
    {
      name: "customer",
      type: "text",
      required: true,
      label: "Kunde",
      admin: {
        description: "Navnet på bedriften historien handler om",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Kort oppsummering",
      admin: {
        description:
          "Én til to setninger som selger historien i listevisning og SEO",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      label: "Hovedbilde",
      admin: {
        description: "Helst et ekte bilde av kunden/bedriften",
        components: {
          afterInput: stockPickerAfterInput,
        },
      },
    },
    qualityReviewPanel(),
    {
      name: "content",
      type: "richText",
      required: true,
      label: "Historien",
      admin: {
        description:
          "Fortell i tre deler: utfordringen (hvor sto de?), hva vi gjorde (konkrete grep), og resultatet (hva endret seg?).",
      },
    },
    {
      name: "results",
      type: "array",
      label: "Resultater i tall",
      maxRows: 4,
      admin: {
        description:
          "Valgfritt, men tall selger – f.eks. «+40 %» / «flere følgere på tre måneder»",
      },
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
          label: "Tall/verdi",
          admin: { description: "F.eks. «+40 %», «3×», «12 000»" },
        },
        {
          name: "label",
          type: "text",
          required: true,
          label: "Hva tallet beskriver",
        },
      ],
    },
    {
      name: "quote",
      type: "group",
      label: "Sitat fra kunden",
      admin: {
        position: "sidebar",
      },
      fields: [
        { name: "text", type: "textarea", label: "Sitat" },
        { name: "author", type: "text", label: "Navn" },
        { name: "role", type: "text", label: "Rolle/tittel" },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
      label: "Publiseringsdato",
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: "sidebar",
        description:
          "Styrer kun rekkefølgen i oversikten – vises ikke på siden",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    ...qualityDataFields({ sidebarSection: true }),
  ],
};
