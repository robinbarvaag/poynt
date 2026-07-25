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
import { BlogPosts } from "./collections/blog-posts";
import { CaseStudies } from "./collections/case-studies";
import { Categories } from "./collections/categories";
import { Courses } from "./collections/courses";
import { Guides } from "./collections/guides";
import { Media } from "./collections/media";
import { Newsletters } from "./collections/newsletters";
import { Orders } from "./collections/orders";
import { Pages } from "./collections/pages";
import { Products } from "./collections/products";
import { Services } from "./collections/services";
import { Users } from "./collections/users";

// Globals
import {
  BlogPage,
  CheckoutSettings,
  Footer,
  Header,
  Homepage,
  PodcastPage,
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
    CaseStudies,
    Services,
    Categories,
    Media,
    Newsletters,
    // On Poynt-innhold (vises i den egenbygde «On Poynt»-nav-gruppen)
    Guides,
    Courses,
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
    CheckoutSettings,
  ],
  admin: {
    user: "users",
    components: {
      afterNavLinks: [
        "/admin/components/on-poynt-nav-group#OnPoyntNavGroup",
        "/admin/components/setup-nav-group#SetupNavGroup",
      ],
      beforeDashboard: ["/admin/components/dashboard/radar-widget#RadarWidget"],
      views: {
        radar: {
          Component: "/admin/views/radar/list#RadarListView",
          path: "/radar",
          exact: true,
          meta: { title: "Innholdsradar" },
        },
        inspiration: {
          Component: "/admin/views/inspiration/list#InspirationListView",
          path: "/inspirasjon",
          exact: true,
          meta: { title: "Inspirasjonskilder" },
        },
        applications: {
          Component:
            "/admin/views/applications/list#MembershipApplicationsListView",
          path: "/soknader",
          exact: true,
          meta: { title: "Søknader" },
        },
        applicationDetail: {
          Component:
            "/admin/views/applications/detail#MembershipApplicationDetailView",
          path: "/soknader/:id",
          meta: { title: "Søknadsdetaljer" },
        },
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
        setupGuide: {
          Component: "/admin/views/setup-guide#SetupGuideView",
          path: "/oppsett",
          exact: true,
          meta: { title: "Betalingsoppsett" },
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
      collections: ["pages", "products", "blog-posts", "case-studies"],
      uploadsCollection: "media",
      // «| Poynt»-suffikset legges på automatisk i frontend (title.template),
      // så meta-tittelen lagres uten suffiks for å unngå dobbel «| Poynt».
      generateTitle: ({ doc }) => doc.title,
      generateDescription: ({ doc }) => doc.excerpt || "",
      generateURL: ({ doc, collectionSlug }) => {
        if (collectionSlug === "pages") {
          return doc.slug === "forside" ? siteUrl : `${siteUrl}/${doc.slug}`;
        }
        if (collectionSlug === "blog-posts") {
          return `${siteUrl}/blogg/${doc.slug}`;
        }
        if (collectionSlug === "case-studies") {
          return `${siteUrl}/kundehistorier/${doc.slug}`;
        }
        return `${siteUrl}/${collectionSlug}/${doc.slug}`;
      },
      tabbedUI: true,
      fields: ({ defaultFields }) => [
        // Pluginets egen «Preview» (kun URL/tekst, uten bilde) byttes ut med
        // vår egen SeoPreview (Google-treff + delingskort med bilde) på samme
        // plass i skjemaet.
        ...defaultFields.map((field) =>
          "name" in field && field.name === "preview"
            ? ({
                name: "seoPreview",
                type: "ui",
                admin: {
                  components: {
                    Field: "/admin/components/seo/seo-preview#SeoPreview",
                  },
                },
              } as const)
            : field
        ),
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
      collections: ["pages", "products", "blog-posts", "case-studies"],
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

                  // Speil søknaden inn i planner_membership_application slik at
                  // partneren får en strukturert «pending → godkjenn»-innboks.
                  try {
                    const { db } = await import("@poynt/planner-db");
                    const { plannerMembershipApplication } = await import(
                      "@poynt/planner-db/schema"
                    );
                    const { canonicalizeEmail } = await import(
                      "@poynt/utils/email-normalize"
                    );

                    const companySizeRaw = get(["bedriftsstorrelse"]);
                    const companySize = [
                      "solo",
                      "small",
                      "medium",
                      "large",
                    ].includes(companySizeRaw ?? "")
                      ? (companySizeRaw as
                          | "solo"
                          | "small"
                          | "medium"
                          | "large")
                      : null;

                    const audienceRaw = get(["malgruppetype"]);
                    const audienceType = ["b2b", "b2c", "both"].includes(
                      audienceRaw ?? ""
                    )
                      ? (audienceRaw as "b2b" | "b2c" | "both")
                      : null;

                    await db.insert(plannerMembershipApplication).values({
                      id: crypto.randomUUID(),
                      status: "pending",
                      fullName:
                        get(["fulltnavn", "navn", "name"]) || applicantEmail,
                      email: applicantEmail,
                      canonicalEmail: canonicalizeEmail(applicantEmail),
                      companyName: get(["bedriftsnavn"]) ?? null,
                      orgNumber: get(["orgnummer"]) ?? null,
                      invoiceEmail: get(["fakturaepost"]) ?? null,
                      revenueOver1m: get(["omsetning"]) ?? null,
                      ehfInvoice: get(["ehffaktura"]) ?? null,
                      invoiceSplit: get(["fakturaoppdeling"]) ?? null,
                      invoiceNotes: get(["fakturainfo"]) ?? null,
                      aboutCompany: get(["ombedriften"]) ?? null,
                      industryId: get(["bransje"]) ?? null,
                      companySize,
                      audienceType,
                      targetAudience: get(["malgruppe"]) ?? null,
                      rawSubmission: entries,
                      formSubmissionId: String(doc.id),
                    });
                  } catch (dbErr) {
                    req.payload.logger.error(
                      `Lagring av medlemskapssøknad feilet: ${dbErr instanceof Error ? dbErr.message : dbErr}`
                    );
                  }

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
