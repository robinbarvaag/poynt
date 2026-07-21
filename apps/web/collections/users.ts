import { renderPasswordResetEmail } from "@poynt/email";
import type { CollectionConfig } from "payload";

const adminUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    forgotPassword: {
      generateEmailSubject: () => "Tilbakestill passordet ditt – Poynt-admin",
      generateEmailHTML: async (args) => {
        const token = args?.token ?? "";
        const user = args?.user as
          | { firstName?: string; email?: string }
          | undefined;
        const url = `${adminUrl}/admin/reset/${token}`;
        const name = user?.firstName || undefined;
        return renderPasswordResetEmail({ url, name });
      },
    },
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "firstName", "lastName"],
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
  ],
};
