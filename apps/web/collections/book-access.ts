import type { CollectionConfig } from "payload";
import { BOOK_STORES, SUSPICIOUS_USES } from "../lib/book-access";

/**
 * Logg over hvem som har låst opp sider som krever bokkjøp. Én rad per
 * ordrenummer per side; `uses` teller hvor mange ganger det er brukt, så et
 * ordrenummer som deles rundt synes — og kan sperres med «Sperret».
 */
export const BookAccess: CollectionConfig = {
  slug: "book-access",
  labels: {
    singular: "Boktilgang",
    plural: "Boktilganger",
  },
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "store", "email", "uses", "lastUsedAt"],
    group: "Nettbutikk",
    description: `Registreres automatisk når noen låser opp en side med «Krever bokkjøp». Ordrenumre kan ikke sjekkes mot ARK/Norli — hold øye med dem som er brukt mer enn ${SUSPICIOUS_USES} ganger, og kryss av «Sperret» ved misbruk.`,
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "orderNumber",
      type: "text",
      required: true,
      index: true,
      label: "Ordrenummer",
      admin: { readOnly: true },
    },
    {
      name: "store",
      type: "select",
      required: true,
      label: "Kjøpt hos",
      options: BOOK_STORES.map((s) => ({ label: s.label, value: s.value })),
      admin: { readOnly: true },
    },
    {
      name: "page",
      type: "relationship",
      relationTo: "pages",
      // Ikke påkrevd: loggen skal overleve at siden slettes (FK er set null).
      index: true,
      label: "Side",
      admin: { readOnly: true },
    },
    {
      name: "email",
      type: "email",
      label: "E-post",
      admin: { readOnly: true },
    },
    {
      name: "newsletterOptIn",
      type: "checkbox",
      label: "Ville ha nyhetsbrev",
      defaultValue: false,
      admin: { readOnly: true },
    },
    {
      name: "uses",
      type: "number",
      label: "Antall ganger brukt",
      defaultValue: 1,
      admin: {
        readOnly: true,
        position: "sidebar",
        description: `Over ${SUSPICIOUS_USES} kan tyde på at ordrenummeret er delt.`,
      },
    },
    {
      name: "lastUsedAt",
      type: "date",
      label: "Sist brukt",
      admin: {
        readOnly: true,
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "blocked",
      type: "checkbox",
      label: "Sperret",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Ordrenummeret kan ikke brukes til å låse opp siden igjen. De som allerede er inne beholder tilgangen på sin enhet.",
      },
    },
  ],
};
