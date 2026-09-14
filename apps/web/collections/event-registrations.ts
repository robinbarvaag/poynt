import type { CollectionConfig } from "payload";
import { REGISTRATION_STATUSES } from "../lib/events/capacity";

/**
 * Påmeldinger til eventer. Opprettes KUN av serveren (lib/events/
 * registrations.ts), aldri direkte via API-et. Partneren jobber med dem fra
 * «Påmeldte»-fanen på eventet og innsjekk-siden — lista her er en reserve,
 * derfor skjult fra menyen (`group: false`).
 */
export const EventRegistrations: CollectionConfig = {
  slug: "event-registrations",
  labels: {
    singular: "Påmelding",
    plural: "Påmeldinger",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "event", "status", "code", "createdAt"],
    group: false,
    description:
      "Påmeldinger til eventer. Enklest å jobbe med fra «Påmeldte»-fanen på selve eventet.",
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  timestamps: true,
  fields: [
    {
      name: "event",
      type: "relationship",
      relationTo: "events",
      required: true,
      index: true,
      label: "Event",
      admin: { readOnly: true },
    },
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Navn",
          admin: { width: "50%" },
        },
        {
          name: "email",
          type: "email",
          required: true,
          index: true,
          label: "E-post",
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "registered",
      index: true,
      label: "Status",
      options: REGISTRATION_STATUSES.map((s) => ({
        label: s.label,
        value: s.value,
      })),
      admin: { position: "sidebar" },
    },
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      label: "Kode",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      // Hemmelig nøkkel i billettlenken/QR-koden. Aldri synlig via API-et —
      // serveren leser den med overrideAccess.
      name: "token",
      type: "text",
      required: true,
      unique: true,
      label: "Billettnøkkel",
      access: {
        read: () => false,
        update: () => false,
      },
      admin: { hidden: true },
    },
    {
      name: "answers",
      type: "json",
      label: "Svar på ekstra spørsmål",
      admin: { readOnly: true },
    },
    {
      name: "newsletter",
      type: "checkbox",
      label: "Ville ha nyhetsbrev",
      defaultValue: false,
      admin: { readOnly: true },
    },
    {
      name: "waitlistPosition",
      type: "number",
      label: "Plass på ventelista",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      type: "collapsible",
      label: "Historikk",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "checkedInAt",
          type: "date",
          label: "Sjekket inn",
          admin: {
            readOnly: true,
            date: { pickerAppearance: "dayAndTime" },
          },
        },
        {
          name: "checkedInBy",
          type: "relationship",
          relationTo: "users",
          label: "Sjekket inn av",
          admin: { readOnly: true },
        },
        {
          name: "cancelledAt",
          type: "date",
          label: "Meldt av",
          admin: {
            readOnly: true,
            date: { pickerAppearance: "dayAndTime" },
          },
        },
        {
          name: "cancelledBy",
          type: "select",
          label: "Meldt av av",
          options: [
            { label: "Personen selv", value: "self" },
            { label: "Admin", value: "admin" },
          ],
          admin: { readOnly: true },
        },
        {
          name: "promotedAt",
          type: "date",
          label: "Rykket opp fra venteliste",
          admin: {
            readOnly: true,
            date: { pickerAppearance: "dayAndTime" },
          },
        },
      ],
    },
  ],
};
