import type { Field } from "payload";

/**
 * Felles felt for vekst-blokkene (interaktive blokker fra «Verdifull vekst»).
 * Innholdsfelt først, presentasjonsvalg i «Utseende» nederst.
 */

export const vekstHeaderFields: Field[] = [
  {
    name: "eyebrow",
    type: "text",
    label: "Etikett (liten tekst over tittel)",
  },
  { name: "title", type: "text", label: "Tittel" },
  { name: "intro", type: "textarea", label: "Ingress" },
];

/** Lenke videre, typisk til et #anker på siden («Til Omsetnings-onsdag»). */
export function vekstLinkFields(description?: string): Field {
  return {
    type: "row",
    fields: [
      {
        name: "linkLabel",
        type: "text",
        label: "Lenketekst",
        admin: { width: "50%" },
      },
      {
        name: "linkUrl",
        type: "text",
        label: "Lenke",
        admin: {
          width: "50%",
          description:
            description ??
            "Et anker på siden (f.eks. #lonnsomhet) eller en adresse (f.eks. /kontakt).",
        },
      },
    ],
  };
}

export function vekstAppearance(): Field {
  return {
    type: "collapsible",
    label: "Utseende",
    admin: { initCollapsed: true },
    fields: [
      {
        name: "palette",
        type: "select",
        label: "Farger",
        defaultValue: "book",
        options: [
          { label: "Bokas farger (lilla og oliven)", value: "book" },
          { label: "Poynt-grønn", value: "poynt" },
        ],
      },
    ],
  };
}
