import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: [
      "email",
      "firstName",
      "lastName",
      "role",
      "membershipTier",
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          type: "text",
          label: "Fornavn",
        },
        {
          name: "lastName",
          type: "text",
          label: "Etternavn",
        },
      ],
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      label: "Profilbilde",
    },
    {
      name: "bio",
      type: "textarea",
      label: "Biografi",
      admin: {
        description: "Kort beskrivelse som vises på blogginnlegg",
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "customer",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Kunde", value: "customer" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "stripeCustomerId",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      label: "Stripe Customer ID",
    },
    {
      name: "membershipTier",
      type: "select",
      required: true,
      defaultValue: "none",
      options: [
        { label: "Ingen medlemskap", value: "none" },
        { label: "Community", value: "community" },
        { label: "Community + AI", value: "community_ai" },
      ],
      label: "Medlemskapsnivå",
      admin: {
        position: "sidebar",
        description: "Brukerens medlemskapsnivå",
      },
    },
    {
      name: "membershipStatus",
      type: "select",
      defaultValue: "inactive",
      options: [
        { label: "Aktiv", value: "active" },
        { label: "Inaktiv", value: "inactive" },
        { label: "Kansellert", value: "canceled" },
        { label: "Forfalt", value: "past_due" },
      ],
      label: "Medlemskapsstatus",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "stripeSubscriptionId",
      type: "text",
      label: "Stripe Subscription ID",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "onboardingCompleted",
      type: "checkbox",
      defaultValue: false,
      label: "Onboarding fullført",
      admin: {
        position: "sidebar",
        description: "Markeres automatisk når brukeren fullfører onboarding",
      },
    },
    {
      name: "purchases",
      type: "relationship",
      relationTo: "orders",
      hasMany: true,
      label: "Kjøp",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
