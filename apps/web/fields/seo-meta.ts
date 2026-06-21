import type { Field } from "payload";

/**
 * Felles SEO-felt («meta»-gruppe) som tidligere var duplisert inline i hver
 * global. Brukes på globals og collections som ikke dekkes av `seoPlugin`.
 *
 * Merk: «| Poynt»-suffikset legges på automatisk i frontend via
 * `title.template`, så meta-tittelen skal skrives UTEN suffiks.
 */
export function seoMetaField(opts?: {
  /** Beskrivelse for «Skjul fra søkemotorer» (nevn gjerne sidenavnet). */
  noIndexDescription?: string;
}): Field {
  return {
    name: "meta",
    type: "group",
    label: "SEO-innstillinger",
    fields: [
      {
        name: "title",
        type: "text",
        label: "Meta-tittel",
        admin: {
          description:
            "Vises i nettleser-fanen og i søkeresultater. «| Poynt» legges på automatisk – skriv uten.",
        },
      },
      {
        name: "description",
        type: "textarea",
        label: "Meta-beskrivelse",
        admin: {
          description:
            "Kort beskrivelse som vises i søkeresultater (maks 160 tegn)",
        },
      },
      {
        name: "image",
        type: "upload",
        relationTo: "media",
        label: "Delingsbilde",
        admin: {
          description:
            "Bilde som vises ved deling på sosiale medier (1200x630px anbefalt)",
        },
      },
      {
        name: "noIndex",
        type: "checkbox",
        label: "Skjul fra søkemotorer",
        defaultValue: false,
        admin: {
          description:
            opts?.noIndexDescription ??
            "Aktivér for å hindre søkemotorer fra å indeksere denne siden",
        },
      },
    ],
  };
}

/**
 * Valgfri FAQ-seksjon. Når den er fylt ut, brukes den til å bygge
 * `FAQPage`-strukturert data (JSON-LD) – et sterkt signal for både Google og
 * generative søkemotorer (GEO/AI). Synlig under SEO-fanen.
 */
export function seoFaqField(): Field {
  return {
    name: "faq",
    type: "array",
    label: "Ofte stilte spørsmål (FAQ)",
    admin: {
      description:
        "Spørsmål og svar som publiseres som strukturert data for søkemotorer og AI-svar. La stå tom for å hoppe over.",
    },
    fields: [
      {
        name: "question",
        type: "text",
        required: true,
        label: "Spørsmål",
      },
      {
        name: "answer",
        type: "textarea",
        required: true,
        label: "Svar",
      },
    ],
  };
}
