import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
// Plugins
import { seoPlugin } from "@payloadcms/plugin-seo";
import { stripePlugin } from "@payloadcms/plugin-stripe";

import { BlogPosts } from "./src/collections/blog-posts";
import { CourseContent } from "./src/collections/course-content";
import { Media } from "./src/collections/media";
import { Orders } from "./src/collections/orders";
import { Pages } from "./src/collections/pages";
import { Products } from "./src/collections/products";
// Collections
import { Users } from "./src/collections/users";

// Globals
import { Footer, Header, SiteSettings, Homepage } from "./src/globals";

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export default buildConfig({
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "development-secret",
  serverURL: siteUrl,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  collections: [
    Users,
    Products,
    Orders,
    CourseContent,
    Pages,
    BlogPosts,
    Media,
  ],
  globals: [SiteSettings, Header, Footer, Homepage],
  admin: {
    user: "users",
  },
  plugins: [
    seoPlugin({
      collections: ["pages", "products", "blog-posts"],
      uploadsCollection: "media",
      generateTitle: ({ doc }) => `${doc.title} | Poynt`,
      generateDescription: ({ doc }) => doc.excerpt || "",
      generateURL: ({ doc, collectionSlug }) => {
        if (collectionSlug === "pages") {
          return doc.slug === "forside" ? siteUrl : `${siteUrl}/${doc.slug}`;
        }
        if (collectionSlug === "blog-posts") {
          return `${siteUrl}/post/${doc.slug}`;
        }
        return `${siteUrl}/${collectionSlug}/${doc.slug}`;
      },
      tabbedUI: true,
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: "noIndex",
          type: "checkbox",
          label: "Skjul fra søkemotorer",
          defaultValue: false,
          admin: {
            description:
              "Aktivér for å hindre Google fra å indeksere denne siden",
          },
        },
        {
          name: "canonicalUrl",
          type: "text",
          label: "Canonical URL (valgfritt)",
          admin: {
            description:
              "Overstyr automatisk canonical URL hvis innholdet finnes på en annen URL",
          },
        },
        {
          name: "ogType",
          type: "select",
          label: "Open Graph type",
          defaultValue: "website",
          options: [
            { label: "Nettside", value: "website" },
            { label: "Artikkel", value: "article" },
            { label: "Produkt", value: "product" },
          ],
          admin: {
            description: "Brukes av sosiale medier ved deling",
          },
        },
      ],
    }),
    redirectsPlugin({
      collections: ["pages", "products", "blog-posts"],
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
            { fieldPath: "name", stripeProperty: "name" },
          ],
        },
      ],
    }),
  ],
});
