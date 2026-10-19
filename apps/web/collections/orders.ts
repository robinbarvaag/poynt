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
        {
          name: "vatRate",
          type: "number",
          label: "MVA-sats (%)",
          admin: {
            description: "Satsen produktet hadde da ordren ble lagt",
          },
        },
      ],
    },
    {
      name: "total",
      type: "number",
      required: true,
      label: "Totalpris (kr)",
      admin: { description: "Inkludert MVA" },
    },
    {
      name: "vatTotal",
      type: "number",
      label: "Herav MVA (kr)",
      admin: {
        description:
          "Beregnet fra varelinjene og produktenes MVA-sats, fordelt på eventuell rabatt",
      },
    },
    {
      name: "termsAccepted",
      type: "checkbox",
      defaultValue: false,
      label: "Godtok vilkår og bortfall av angrerett",
      admin: {
        position: "sidebar",
        description:
          "Kunden huket aktivt av for umiddelbar levering og bortfall av angrerett før betaling (angrerettloven § 22 n)",
      },
    },
    {
      name: "termsAcceptedAt",
      type: "date",
      label: "Vilkår godtatt",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "d. MMM yyyy HH:mm",
        },
        description: "Tidspunktet kunden huket av boksen i kassen",
      },
    },
    {
      name: "termsAcceptedText",
      type: "textarea",
      label: "Samtykketekst kunden godtok",
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Kopi av teksten ved avkryssingsboksen slik den var da kjøpet ble gjort — dokumentasjon ved en eventuell tvist",
      },
    },
    {
      name: "requiresShipping",
      type: "checkbox",
      defaultValue: false,
      label: "Skal sendes",
      admin: {
        description:
          "Minst ett produkt i bestillingen er merket «Krever frakt». Mangler adressen under, må kunden kontaktes.",
      },
    },
    {
      name: "shipping",
      type: "group",
      label: "Leveringsadresse",
      admin: {
        condition: (data) => data?.requiresShipping === true,
        description:
          "Samlet inn av Stripe (adresseskjema i kassen) eller Vipps (kunden deler adressen i appen).",
      },
      fields: [
        { name: "name", type: "text", label: "Mottaker" },
        { name: "line1", type: "text", label: "Adresse" },
        { name: "line2", type: "text", label: "Adresse, linje 2" },
        {
          type: "row",
          fields: [
            { name: "postalCode", type: "text", label: "Postnummer" },
            { name: "city", type: "text", label: "Poststed" },
          ],
        },
        {
          name: "country",
          type: "text",
          label: "Land",
          admin: { description: "Landkode, f.eks. NO" },
        },
        { name: "phone", type: "text", label: "Telefon" },
      ],
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
