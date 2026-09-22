import type { CollectionConfig } from "payload";
import { CHANNEL_OPTIONS, SALE_SOURCE_OPTIONS } from "../lib/boksalg/constants";

/**
 * Alt Susanne faktisk har solgt — «solgt inn», altså øyeblikket hun får betalt.
 *
 * Her føres bokhandlernes innkjøp (Norli kjøper 400 eksemplarer), avregninger
 * fra distributøren, bøker solgt i pausen på et foredrag og direktesalg til
 * bedrifter. Bestillinger i egen nettbutikk telles automatisk fra Bestillinger
 * og skal IKKE føres her.
 *
 * Merk skillet mot lagertallene vi henter fra Norli: de måler hvor fort bøkene
 * går ut av hylla («ut av hyllene»), altså etterspørsel. De er ikke omsetning —
 * de samme bøkene er allerede betalt for da bokhandelen kjøpte dem, og ville
 * blitt talt to ganger om de ble lagt sammen med radene her. Dashbordet holder
 * dem derfor adskilt.
 */
export const BookSales: CollectionConfig = {
  slug: "book-sales",
  labels: {
    singular: "Boksalg",
    plural: "Boksalg",
  },
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["date", "channel", "copies", "saleSource", "reference"],
    // Vises kun i den egenbygde «Boka»-nav-gruppen.
    group: false,
    description:
      "Salg som føres for hånd: bokhandlernes innkjøp, avregninger fra distributør, foredragssalg og direktesalg. Nettbutikken telles automatisk.",
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  defaultSort: "-date",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "date",
          type: "date",
          label: "Dato",
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: "50%",
            date: {
              pickerAppearance: "dayOnly",
              displayFormat: "d. MMM yyyy",
            },
            description: "Når salget skjedde — ikke når du fører det inn.",
          },
        },
        {
          name: "copies",
          type: "number",
          label: "Antall bøker",
          required: true,
          min: 1,
          admin: {
            width: "50%",
            description:
              "Alltid et positivt tall — også for en retur. Da er det «Hva slags salg» som gjør at den trekkes fra.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "channel",
          type: "select",
          label: "Kanal",
          required: true,
          options: CHANNEL_OPTIONS,
          admin: {
            width: "50%",
            description: "Avgjør hvilke kutt som trekkes fra.",
          },
        },
        {
          name: "saleSource",
          type: "select",
          label: "Hva slags salg",
          required: true,
          defaultValue: "innkjop",
          options: [...SALE_SOURCE_OPTIONS],
          admin: {
            width: "50%",
            components: {
              // Forklaring per valg — se admin/components/sale-source-help.tsx.
              Description: "/admin/components/sale-source-help#SaleSourceHelp",
            },
          },
        },
      ],
    },
    {
      name: "unitPrice",
      type: "number",
      label: "Pris per bok (kr)",
      min: 0,
      admin: {
        description:
          "La stå tom for å bruke utsalgsprisen fra Bokøkonomi. Fyll ut ved rabatt, f.eks. et samlet kjøp til en bedrift.",
      },
    },
    {
      name: "reference",
      type: "text",
      label: "Referanse",
      admin: {
        description:
          "F.eks. ordrenummer, avregningsnummer eller «Lansering Bergen». Gjør det lettere å finne igjen raden senere.",
      },
    },
    {
      name: "notes",
      type: "textarea",
      label: "Notat",
    },
  ],
};
