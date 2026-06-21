import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
// Plugins
import { seoPlugin } from "@payloadcms/plugin-seo";
import { stripePlugin } from "@payloadcms/plugin-stripe";

// Collections
import { Articles } from "./collections/articles";
import { BlogPosts } from "./collections/blog-posts";
import { Categories } from "./collections/categories";
import { Media } from "./collections/media";
import { Orders } from "./collections/orders";
import { Pages } from "./collections/pages";
import { Podcasts } from "./collections/podcasts";
import { Products } from "./collections/products";
import { Services } from "./collections/services";
import { Users } from "./collections/users";

// Globals
import {
  BlogPage,
  Footer,
  Header,
  Homepage,
  PodcastPage,
  ProductSettings,
  ProductsPage,
  ServicesPage,
  SiteSettings,
} from "./globals";

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

export default buildConfig({
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "development-secret",
  serverURL: siteUrl,
  email: resendAdapter({
    // TODO: bytt til verifisert domene (t.d. noreply@dittdomene.no) når domenet er
    // verifisert i Resend. onboarding@resend.dev kan berre sende til eiga konto-adresse.
    defaultFromName: "On Poynt",
    defaultFromAddress: "onboarding@resend.dev",
    apiKey: process.env.RESEND_API_KEY || "",
  }),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
    push: false,
    migrationDir: path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "migrations"
    ),
  }),
  sharp,
  collections: [
    // Innhold
    Pages,
    BlogPosts,
    Articles,
    Podcasts,
    Services,
    Categories,
    Media,
    // Nettbutikk
    Products,
    Orders,
    // Hidden
    Users,
  ],
  globals: [
    // Sideoppsett
    Homepage,
    BlogPage,
    PodcastPage,
    ProductsPage,
    ServicesPage,
    // Innstillinger
    Header,
    Footer,
    SiteSettings,
    ProductSettings,
  ],
  admin: {
    user: "users",
    components: {
      afterNavLinks: ["/admin/components/on-poynt-nav-group#OnPoyntNavGroup"],
      views: {
        members: {
          Component: "/admin/views/members/list#MembersListView",
          path: "/medlemmer",
          exact: true,
          meta: { title: "Medlemmer" },
        },
        memberDetail: {
          Component: "/admin/views/members/detail#MemberDetailView",
          path: "/medlemmer/:id",
          meta: { title: "Medlemsdetaljer" },
        },
        industries: {
          Component: "/admin/views/industries/list#IndustriesListView",
          path: "/bransjar",
          exact: true,
          meta: { title: "Bransjer" },
        },
        prompts: {
          Component: "/admin/views/prompts/list#PromptsListView",
          path: "/prompts",
          exact: true,
          meta: { title: "Prompt-maler" },
        },
      },
    },
  },
  plugins: [
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            collections: {
              media: true,
            },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
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
          return `${siteUrl}/blogg/${doc.slug}`;
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
        hooks: {
          afterChange: [
            async ({ doc, operation, req }) => {
              if (operation !== "create") return doc;
              try {
                const entries = (doc.submissionData ?? []) as {
                  field: string;
                  value: string;
                }[];
                const get = (names: string[]) =>
                  entries.find((e) =>
                    names.includes((e.field ?? "").toLowerCase())
                  )?.value;

                const { sendContactEmails } = await import("@poynt/email");

                // Medlemskapssøknad har eget felt-sett (bedrift/faktura) – ingen
                // "melding"/"epost". Gjenkjenn det og sett sammen et sammendrag.
                const isMembership =
                  !!get(["bedriftsnavn"]) || !!get(["orgnummer"]);
                if (isMembership) {
                  const applicantEmail = get(["dinepost", "epost", "email"]);
                  if (!applicantEmail) return doc;

                  const line = (label: string, names: string[]) => {
                    const value = get(names);
                    return value ? `${label}: ${value}` : null;
                  };
                  const message = [
                    line("Bedrift", ["bedriftsnavn"]),
                    line("Org.nr", ["orgnummer"]),
                    line("E-post for faktura", ["fakturaepost"]),
                    line("Omsetter over 1 mill/år", ["omsetning"]),
                    line("EHF-faktura", ["ehffaktura"]),
                    line("Fakturaoppdeling", ["fakturaoppdeling"]),
                    line("Fakturainfo", ["fakturainfo"]),
                    line("Om bedriften", ["ombedriften"]),
                  ]
                    .filter(Boolean)
                    .join("\n");

                  await sendContactEmails({
                    name: get(["fulltnavn", "navn", "name"]) || "Ukjent",
                    email: applicantEmail,
                    subject: "Medlemskapssøknad – On Poynt",
                    message,
                    source: get(["kilde", "source"]),
                    sourcePath: get(["sti", "path"]),
                  });
                  return doc;
                }

                const email = get(["epost", "email", "e-post"]);
                const message = get(["melding", "message", "beskjed"]);
                if (!email || !message) return doc;

                await sendContactEmails({
                  name: get(["navn", "name"]) || "Ukjent",
                  email,
                  phone: get(["telefon", "phone", "tlf"]),
                  subject: get(["emne", "subject", "tema"]),
                  message,
                  // Intern sporing: hvor henvendelsen ble sendt fra.
                  source: get(["kilde", "source"]),
                  sourcePath: get(["sti", "path"]),
                });
              } catch (err) {
                req.payload.logger.error(
                  `Kontakt-e-post feilet: ${err instanceof Error ? err.message : err}`
                );
              }
              return doc;
            },
          ],
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
          fields: [{ fieldPath: "name", stripeProperty: "name" }],
        },
      ],
    }),
  ],
});
