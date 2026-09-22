import type { CollectionConfig } from "payload";
import { SOURCE_OPTIONS, STOCK_EVENT_OPTIONS } from "../lib/boksalg/constants";

/**
 * Endringsloggen: én rad hver gang noe faktisk skjedde med boka ute i
 * butikkene. Skrives bare ved endring, så lista er signal og ikke støy —
 * 197 uendrede butikker gir null rader.
 *
 * «Salg» er et estimat utledet av at lagerbeholdningen gikk ned. Påfyll og
 * butikker som forsvinner fra lista får egne typer og telles ikke som salg.
 * Begrunnelsen står i lib/boksalg/diff.ts.
 */
export const BookStockEvents: CollectionConfig = {
  slug: "book-stock-events",
  labels: {
    singular: "Lagerendring",
    plural: "Lagerendringer",
  },
  admin: {
    useAsTitle: "storeName",
    defaultColumns: [
      "occurredAt",
      "type",
      "storeName",
      "delta",
      "fromQty",
      "toQty",
    ],
    // Vises kun i den egenbygde «Boka»-nav-gruppen.
    group: false,
    description:
      "Hva som har skjedd i butikkene, dag for dag. Skrives automatisk ved hver henting.",
    listSearchableFields: ["storeName", "city"],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    // Skrives kun av cron-jobben via det lokale API-et (som går utenom access).
    create: () => false,
    update: () => false,
    delete: ({ req: { user } }) => !!user,
  },
  defaultSort: "-occurredAt",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "occurredAt",
          type: "date",
          label: "Oppdaget",
          required: true,
          index: true,
          admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } },
        },
        {
          name: "type",
          type: "select",
          label: "Hva skjedde",
          required: true,
          options: STOCK_EVENT_OPTIONS,
          index: true,
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "sourceKey",
          type: "select",
          label: "Bokhandel",
          required: true,
          options: SOURCE_OPTIONS,
          index: true,
          admin: { width: "50%" },
        },
        {
          name: "delta",
          type: "number",
          label: "Antall eksemplarer",
          defaultValue: 0,
          admin: {
            width: "50%",
            description: "Alltid positivt — typen sier hvilken vei det gikk.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "storeName",
          type: "text",
          label: "Butikk",
          admin: { width: "50%" },
        },
        {
          name: "city",
          type: "text",
          label: "By",
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "region",
          type: "text",
          label: "Region",
          admin: { width: "34%" },
        },
        {
          name: "fromQty",
          type: "number",
          label: "Fra",
          admin: { width: "33%" },
        },
        {
          name: "toQty",
          type: "number",
          label: "Til",
          admin: { width: "33%" },
        },
      ],
    },
    {
      name: "storeId",
      type: "text",
      label: "Butikk-ID hos kjeden",
      index: true,
    },
    {
      name: "note",
      type: "text",
      label: "Merknad",
    },
  ],
};
