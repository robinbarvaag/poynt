import type { CollectionConfig } from "payload";
import { AVAILABILITY_OPTIONS, SOURCE_OPTIONS } from "../lib/boksalg/constants";

/**
 * Ett lagerbilde per kilde per henting — rådataen bak endringsloggen.
 *
 * Butikkene ligger som JSON i én rad i stedet for én rad per butikk per dag:
 * Norli har 197 butikker, så det ville blitt ~72 000 rader i året mot 365.
 * Vi trenger dem heller aldri enkeltvis — de leses alltid som et helt bilde,
 * enten for å sammenlignes med gårsdagens eller for å tegne butikk-tabellen.
 *
 * Skrives av cron-jobben (lib/inngest/functions/book-stock.ts). Låst for
 * redigering i admin: retter man et lagerbilde for hånd, lyver endringsloggen.
 */
export const BookStockSnapshots: CollectionConfig = {
  slug: "book-stock-snapshots",
  labels: {
    singular: "Lagerbilde",
    plural: "Lagerbilder",
  },
  admin: {
    useAsTitle: "fetchedAt",
    defaultColumns: [
      "fetchedAt",
      "sourceKey",
      "online",
      "storesWithStock",
      "totalCopies",
    ],
    // Vises kun i den egenbygde «Boka»-nav-gruppen.
    group: false,
    description:
      "Rådata fra den automatiske hentingen. Kun til oppslag — endringene ligger i Lagerendringer.",
  },
  access: {
    read: ({ req: { user } }) => !!user,
    // Skrives kun av cron-jobben via det lokale API-et (som går utenom access).
    create: () => false,
    update: () => false,
    delete: ({ req: { user } }) => !!user,
  },
  defaultSort: "-fetchedAt",
  fields: [
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
          name: "fetchedAt",
          type: "date",
          label: "Hentet",
          required: true,
          index: true,
          admin: {
            width: "50%",
            date: { pickerAppearance: "dayAndTime" },
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "online",
          type: "select",
          label: "Status i nettbutikken",
          required: true,
          options: AVAILABILITY_OPTIONS,
          admin: { width: "50%" },
        },
        {
          name: "price",
          type: "number",
          label: "Pris kjeden viser (kr)",
          admin: {
            width: "50%",
            description: "Til kontroll mot vår egen utsalgspris.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "storeCount",
          type: "number",
          label: "Butikker sjekket",
          defaultValue: 0,
          admin: { width: "33%" },
        },
        {
          name: "storesWithStock",
          type: "number",
          label: "Butikker med boka",
          defaultValue: 0,
          admin: { width: "33%" },
        },
        {
          name: "totalCopies",
          type: "number",
          label: "Eksemplarer i butikk",
          defaultValue: 0,
          admin: { width: "34%" },
        },
      ],
    },
    {
      name: "externalId",
      type: "text",
      label: "Kjedens produkt-ID",
    },
    {
      name: "note",
      type: "text",
      label: "Merknad",
    },
    {
      name: "stores",
      type: "json",
      label: "Butikker",
      admin: {
        description:
          "Hele butikklista slik den så ut ved hentingen. Brukes til å regne ut endringer.",
      },
    },
  ],
};
