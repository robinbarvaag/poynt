import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import type { Order } from "../payload-types";

/**
 * Felt som settes av betalingen (kassene og webhookene). Partneren kan åpne
 * og lagre en bestilling for å sette forsendelsesstatus, rette adressen eller
 * skrive et notat, men disse skal aldri endres fra admin — `readOnly` i
 * skjemaet, og hooken under setter dem tilbake til lagret verdi uansett hva
 * som sendes inn.
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

const DATE_TIME = {
  pickerAppearance: "dayAndTime",
  displayFormat: "d. MMM yyyy HH:mm",
} as const;

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
      "Bestillinger opprettes av betalingen og kan ikke lages for hånd. Det du styrer selv: forsendelsen (bøker og andre varer som skal i posten), leveringsadressen og et internt notat. Bruk «Skal sendes» over lista for å se hva som venter.",
    defaultColumns: [
      "customerEmail",
      "items",
      "status",
      "shippingStatus",
      "total",
      "createdAt",
    ],
    listSearchableFields: [
      "customerEmail",
      "customerName",
      "vippsReference",
      "internalNote",
    ],
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
    // ── Hovedkolonnen ────────────────────────────────────────────────────
    {
      type: "row",
      fields: [
        {
          name: "customerEmail",
          type: "email",
          label: "E-post",
          admin: {
            width: "50%",
            description:
              "Settes ved betaling. Vipps-ordrer får e-post først når kunden har godkjent i appen.",
          },
        },
        {
          name: "customerName",
          type: "text",
          label: "Navn",
          admin: {
            width: "50%",
            description:
              "Fra betalingen. Tomt om kunden ikke oppga navn — da står mottakeren under leveringsadressen.",
          },
        },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      label: "Varer",
      admin: {
        readOnly: true,
        initCollapsed: true,
        components: {
          RowLabel: "/admin/components/orders/order-items#OrderItemRowLabel",
          Cell: "/admin/components/orders/order-items#OrderItemsCell",
        },
      },
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
          label: "Produkt",
        },
        {
          // Navnet slik det var da kjøpet ble gjort — produktet kan døpes
          // om senere, og eldre ordrer uten navn fylles av
          // scripts/backfill-orders.ts.
          name: "name",
          type: "text",
          label: "Produktnavn ved kjøp",
        },
        {
          type: "row",
          fields: [
            {
              name: "quantity",
              type: "number",
              required: true,
              defaultValue: 1,
              label: "Antall",
              admin: { width: "25%" },
            },
            {
              name: "priceAtPurchase",
              type: "number",
              required: true,
              label: "Pris ved kjøp (kr)",
              admin: { width: "25%" },
            },
            {
              name: "vatRate",
              type: "number",
              label: "MVA-sats (%)",
              admin: { width: "25%" },
            },
            {
              name: "variant",
              type: "text",
              label: "Variant",
              admin: {
                width: "25%",
                description: "F.eks. «Signert: Ja»",
              },
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "total",
          type: "number",
          required: true,
          label: "Totalt betalt (kr)",
          admin: {
            width: "50%",
            description: "Inkludert MVA og etter eventuell rabattkode",
            readOnly: true,
          },
        },
        {
          name: "vatTotal",
          type: "number",
          label: "Herav MVA (kr)",
          admin: {
            width: "50%",
            readOnly: true,
            description: "Beregnet fra varelinjene og produktenes MVA-sats",
          },
        },
      ],
    },
    {
      name: "shipping",
      type: "group",
      label: "Leveringsadresse",
      admin: {
        condition: (data) => data?.requiresShipping === true,
        description:
          "Fylt inn av kunden i handlekurven før betaling. Kan rettes her om kunden tar kontakt.",
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
      name: "internalNote",
      type: "textarea",
      label: "Internt notat",
      admin: {
        description:
          "Bare for deg — kunden ser det ikke. F.eks. «ringte kunden om adressen» eller «sendt som brev».",
      },
    },
    {
      // Bare relevant for digitalt innhold (angrerettloven § 22 n). Ordrer
      // med bare fysiske varer har aldri vist boksen, så panelet skjules.
      type: "collapsible",
      label: "Samtykke til bortfall av angrerett",
      admin: {
        initCollapsed: true,
        condition: (data) => data?.termsAccepted === true,
        description:
          "Kunden huket aktivt av for umiddelbar levering og bortfall av angrerett før betaling. Gjelder bare digitalt innhold.",
      },
      fields: [
        {
          name: "termsAccepted",
          type: "checkbox",
          defaultValue: false,
          label: "Godtok vilkår og bortfall av angrerett",
          admin: { hidden: true },
        },
        {
          name: "termsAcceptedAt",
          type: "date",
          label: "Huket av",
          admin: { readOnly: true, date: DATE_TIME },
        },
        {
          name: "termsAcceptedText",
          type: "textarea",
          label: "Teksten kunden så",
          admin: {
            readOnly: true,
            description:
              "Kopi av teksten ved avkryssingsboksen slik den var da kjøpet ble gjort — dokumentasjon ved en eventuell tvist.",
          },
        },
      ],
    },

    // ── Sidekolonnen ─────────────────────────────────────────────────────
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Avventer betaling", value: "pending" },
        { label: "Betalt", value: "paid" },
        { label: "Avbrutt", value: "cancelled" },
      ],
      label: "Betaling",
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Settes av betalingen. «Avventer» er en Vipps-betaling kunden ikke har fullført i appen ennå.",
      },
    },
    {
      name: "paymentProvider",
      type: "select",
      required: true,
      defaultValue: "stripe",
      options: [
        { label: "Kort (Stripe)", value: "stripe" },
        { label: "Vipps", value: "vipps" },
      ],
      label: "Betalt med",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "requiresShipping",
      type: "checkbox",
      defaultValue: false,
      label: "Skal sendes",
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Minst én vare er merket «Krever frakt». Mangler leveringsadressen, må kunden kontaktes.",
      },
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
          "Sett til «Sendt» når pakken er levert inn, og lagre. Da forsvinner bestillingen fra «Skal sendes».",
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
        date: DATE_TIME,
        description: "Settes automatisk når forsendelsen markeres som sendt.",
      },
    },
    {
      name: "shippingNote",
      type: "text",
      label: "Sporingsnummer",
      admin: {
        position: "sidebar",
        condition: (data) => data?.requiresShipping === true,
        description: "Valgfritt. F.eks. sporingsnummer fra Posten.",
      },
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
          "Kunden krysset av for nyhetsbrev i kassen og er meldt på i Resend.",
      },
    },
    {
      // Referansene trengs bare når noe skal slås opp hos Stripe/Vipps
      // (refusjon, tvist). Ute av veien til vanlig.
      type: "collapsible",
      label: "Betalingsreferanser",
      admin: {
        position: "sidebar",
        initCollapsed: true,
        description:
          "Bruk disse om du må finne betalingen igjen i Stripe eller Vipps, f.eks. for å refundere.",
      },
      fields: [
        {
          name: "vippsReference",
          type: "text",
          label: "Vipps-referanse",
          index: true,
          admin: {
            readOnly: true,
            condition: (data) => data?.paymentProvider === "vipps",
          },
        },
        {
          name: "stripeSessionId",
          type: "text",
          label: "Stripe Checkout-sesjon",
          admin: {
            readOnly: true,
            condition: (data) => data?.paymentProvider === "stripe",
          },
        },
        {
          name: "stripePaymentIntentId",
          type: "text",
          label: "Stripe Payment Intent",
          admin: {
            readOnly: true,
            condition: (data) => data?.paymentProvider === "stripe",
            description:
              "Søk på denne i Stripe-dashbordet for å se eller refundere betalingen.",
          },
        },
      ],
    },
  ],
};
