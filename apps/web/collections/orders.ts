import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import type { Order } from "../payload-types";

/**
 * Felt som settes av betalingen (kassene og webhookene). Partneren kan åpne
 * og lagre en bestilling for å sette forsendelsesstatus eller rette adressen,
 * men disse skal aldri endres fra admin — `readOnly` i skjemaet, og hooken
 * under setter dem tilbake til lagret verdi uansett hva som sendes inn.
 */
const PAYMENT_FIELDS = [
  "items",
  "total",
  "vatTotal",
  "termsAccepted",
  "termsAcceptedAt",
  "termsAcceptedText",
  "requiresShipping",
  "status",
  "newsletterOptIn",
  "paymentProvider",
  "vippsReference",
  "stripeSessionId",
  "stripePaymentIntentId",
] as const satisfies readonly (keyof Order)[];

const guardOrderChanges: CollectionBeforeChangeHook<Order> = ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  // Fra admin (innlogget bruker): betalingsfeltene låses. Webhookene bruker
  // det lokale API-et uten bruker og får oppdatere status som før.
  if (operation === "update" && req.user && originalDoc) {
    for (const key of PAYMENT_FIELDS) {
      (data as Record<string, unknown>)[key] = originalDoc[key];
    }
  }

  // Forsendelse: bare bestillinger med fysiske varer har en status. Nye
  // ordrer starter som «Under behandling»; «Sendt» stempler tidspunktet.
  const requiresShipping =
    data.requiresShipping ?? originalDoc?.requiresShipping ?? false;
  if (!requiresShipping) {
    data.shippingStatus = null;
    data.shippedAt = null;
    return data;
  }
  const next = data.shippingStatus ?? originalDoc?.shippingStatus ?? "pending";
  data.shippingStatus = next;
  if (next === "shipped") {
    const alreadyShipped = originalDoc?.shippingStatus === "shipped";
    data.shippedAt =
      (alreadyShipped ? (data.shippedAt ?? originalDoc?.shippedAt) : null) ??
      new Date().toISOString();
  } else {
    data.shippedAt = null;
  }
  return data;
};

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Bestilling",
    plural: "Bestillinger",
  },
  admin: {
    useAsTitle: "customerEmail",
    group: "Nettbutikk",
    description:
      "Bestillinger opprettes av betalingen. Bøker som skal i posten: bruk «Skal sendes» over lista, og sett «Forsendelse» til «Sendt» når pakken er levert inn.",
    defaultColumns: [
      "customerEmail",
      "customerName",
      "status",
      "shippingStatus",
      "total",
      "createdAt",
    ],
    listSearchableFields: ["customerEmail", "customerName", "vippsReference"],
    // «Grupper etter» i lista, f.eks. etter forsendelsesstatus.
    groupBy: true,
    components: {
      beforeListTable: ["/admin/components/orders/order-filters#OrderFilters"],
    },
  },
  access: {
    create: () => false,
    // Partneren trenger å lagre forsendelsesstatus og rette adressen —
    // betalingsfeltene låses i `guardOrderChanges`.
    update: ({ req: { user } }) => !!user,
    delete: () => false,
    read: ({ req: { user } }) => !!user,
  },
  hooks: {
    beforeChange: [guardOrderChanges],
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
      admin: { readOnly: true },
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
      admin: { description: "Inkludert MVA", readOnly: true },
    },
    {
      name: "vatTotal",
      type: "number",
      label: "Herav MVA (kr)",
      admin: {
        readOnly: true,
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
        readOnly: true,
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
        readOnly: true,
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
          "Fylt inn av kunden i handlekurven før betaling (gjelder både kort og Vipps).",
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
      // Partnerens arbeidsflyt for fysiske varer. Settes til «Under
      // behandling» av hooken når ordren opprettes, og til «Sendt» av
      // partneren når pakken er levert inn. Hurtigfiltrene over lista
      // («Skal sendes» / «Sendt») bygger på dette feltet.
      name: "shippingStatus",
      type: "select",
      label: "Forsendelse",
      options: [
        { label: "Under behandling", value: "pending" },
        { label: "Sendt", value: "shipped" },
      ],
      admin: {
        position: "sidebar",
        condition: (data) => data?.requiresShipping === true,
        description:
          "Sett til «Sendt» når pakken er levert inn. Da forsvinner bestillingen fra «Skal sendes».",
      },
    },
    {
      name: "shippedAt",
      type: "date",
      label: "Sendt",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.shippingStatus === "shipped",
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "d. MMM yyyy HH:mm",
        },
        description: "Settes automatisk når forsendelsen markeres som sendt.",
      },
    },
    {
      name: "shippingNote",
      type: "text",
      label: "Sporingsnummer / notat",
      admin: {
        position: "sidebar",
        condition: (data) => data?.requiresShipping === true,
        description: "Valgfritt. F.eks. sporingsnummer fra Posten.",
      },
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
      admin: { readOnly: true },
    },
    {
      name: "newsletterOptIn",
      type: "checkbox",
      defaultValue: false,
      label: "Ønsker nyhetsbrev",
      admin: {
        position: "sidebar",
        readOnly: true,
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
        readOnly: true,
      },
    },
    {
      name: "vippsReference",
      type: "text",
      label: "Vipps-referanse",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "stripeSessionId",
      type: "text",
      label: "Stripe Session ID",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "stripePaymentIntentId",
      type: "text",
      label: "Stripe Payment Intent ID",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
  ],
};
