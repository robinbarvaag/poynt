import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

// Plugins
import { seoPlugin } from "@payloadcms/plugin-seo";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { stripePlugin } from "@payloadcms/plugin-stripe";

// Collections
import { Users } from "./src/collections/users";
import { Products } from "./src/collections/products";
import { Orders } from "./src/collections/orders";
import { CourseContent } from "./src/collections/course-content";
import { Pages } from "./src/collections/pages";
import { Media } from "./src/collections/media";

// Globals
import { SiteSettings, Header, Footer } from "./src/globals";

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export default buildConfig({
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "development-secret",
  serverURL: siteUrl,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
    push: process.env.NODE_ENV !== "production",
  }),
  sharp,
  collections: [Users, Products, Orders, CourseContent, Pages, Media],
  globals: [SiteSettings, Header, Footer],
  admin: {
    user: "users",
  },
  plugins: [
    seoPlugin({
      collections: ["pages", "products"],
      uploadsCollection: "media",
      generateTitle: ({ doc }) => `${doc.title} | Poynt`,
      generateDescription: ({ doc }) => doc.excerpt || "",
      generateURL: ({ doc, collectionSlug }) => {
        if (collectionSlug === "pages") {
          return doc.slug === "forside" ? siteUrl : `${siteUrl}/${doc.slug}`;
        }
        return `${siteUrl}/${collectionSlug}/${doc.slug}`;
      },
      tabbedUI: true,
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: "keywords",
          type: "text",
          label: "Nøkkelord",
          admin: {
            description: "Kommaseparerte nøkkelord",
          },
        },
      ],
    }),
    redirectsPlugin({
      collections: ["pages", "products"],
      overrides: {
        admin: {
          group: "Innstillinger",
        },
        labels: {
          singular: "Omdirigering",
          plural: "Omdirigeringer",
        },
      },
    }),
    formBuilderPlugin({
      formOverrides: {
        admin: {
          group: "Skjemaer",
        },
        labels: {
          singular: "Skjema",
          plural: "Skjemaer",
        },
      },
      formSubmissionOverrides: {
        admin: {
          group: "Skjemaer",
        },
        labels: {
          singular: "Innsending",
          plural: "Innsendinger",
        },
      },
    }),
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
      sync: [
        {
          collection: "products",
          stripeResourceType: "products",
          stripeResourceTypeSingular: "product",
          fields: [
            { fieldPath: "title", stripeProperty: "name" },
            { fieldPath: "description", stripeProperty: "description" },
          ],
        },
      ],
    }),
  ],
});
