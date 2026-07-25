import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Bestilling",
    plural: "Bestillinger",
  },
  admin: {
    useAsTitle: "customerEmail",
    group: "Nettbutikk",
  },
  access: {
    create: () => false,
    update: () => false,
    delete: () => false,
    read: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "customerEmail",
      type: "email",
      label: "Kunde e-post",
      admin: {
        description:
          "Settes ved betaling — Vipps-ordrer får e-post først når kunden har godkjent i appen",
      },
    },
    {
      name: "customerName",
      type: "text",
      label: "Kundenavn",
    },
    {
      name: "items",
      type: "array",
      required: true,
      label: "Produkter",
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
          label: "Produkt",
        },
        {
          name: "quantity",
          type: "number",
          required: true,
          defaultValue: 1,
          label: "Antal",
        },
        {
          name: "variant",
          type: "text",
          label: "Variant",
          admin: {
            description: "Valgt variant, t.d. «Signert: Ja» (om aktuelt)",
          },
        },
        {
          name: "priceAtPurchase",
          type: "number",
          required: true,
          label: "Pris ved kjøp (kr)",
        },
      ],
    },
    {
      name: "total",
      type: "number",
      required: true,
      label: "Totalpris (kr)",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Avventer", value: "pending" },
        { label: "Betalt", value: "paid" },
        { label: "Avbrutt", value: "cancelled" },
      ],
      label: "Status",
    },
    {
      name: "newsletterOptIn",
      type: "checkbox",
      defaultValue: false,
      label: "Ønsker nyhetsbrev",
      admin: {
        position: "sidebar",
        description:
          "Kunden krysset aktivt av for nyhetsbrev i utsjekken (dokumentert samtykke)",
      },
    },
    {
      name: "paymentProvider",
      type: "select",
      required: true,
      defaultValue: "stripe",
      options: [
        { label: "Stripe (kort)", value: "stripe" },
        { label: "Vipps", value: "vipps" },
      ],
      label: "Betalingsleverandør",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "vippsReference",
      type: "text",
      label: "Vipps-referanse",
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "stripeSessionId",
      type: "text",
      label: "Stripe Session ID",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "stripePaymentIntentId",
      type: "text",
      label: "Stripe Payment Intent ID",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
