import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { nb } from "@payloadcms/translations/languages/nb";
import { buildConfig } from "payload";
import sharp from "sharp";

import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
// Plugins
import { seoPlugin } from "@payloadcms/plugin-seo";
import { stripePlugin } from "@payloadcms/plugin-stripe";

import { rateLimit } from "./lib/rate-limit";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "./lib/revalidate-cms";

// Collections
import { BlogPosts } from "./collections/blog-posts";
import { CaseStudies } from "./collections/case-studies";
import { Categories } from "./collections/categories";
import { Courses } from "./collections/courses";
import { EmailTemplates } from "./collections/email-templates";
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
  OnPoyntFeatures,
  PodcastPage,
  ProductsPage,
  ServicesPage,
  SiteSettings,
} from "./globals";

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// Uten secret ville Payload ellers falt tilbake på en kjent verdi — som gjør
// admin-sesjoner forfalskbare i produksjon. Da er det bedre å stoppe bygget.
const payloadSecret = process.env.PAYLOAD_SECRET;
if (!payloadSecret) {
  throw new Error("PAYLOAD_SECRET er ikke satt — sett den i miljøet");
}

/**
 * EMAIL_FROM kan være en bar adresse («no-reply@poynt.no») eller hele strengen
 * «Poynt <no-reply@poynt.no>» — samme regel som buildFrom i @poynt/email.
 */
function parseEmailFrom(): { name: string; address: string } {
  const configured = (process.env.EMAIL_FROM || "").trim();
  const match = configured.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || "Poynt", address: match[2].trim() };
  }
  return { name: "Poynt", address: configured || "onboarding@resend.dev" };
}
const emailFromParts = parseEmailFrom();

/**
 * Norske etiketter på form-builder-pluginens «emails»-felt (Skjemaer). Pluginen
 * bruker engelske i18n-nøkler; her får partneren hverdagsspråk i stedet.
 */
const FORM_EMAIL_FIELD_LABELS: Record<
  string,
  { label: string; description?: string }
> = {
  emailTo: {
    label: "Send til",
    description:
      "Skriv {{epost}} for å sende til adressen fra skjemaet, eller en fast adresse.",
  },
  cc: { label: "Kopi (CC)" },
  bcc: { label: "Blindkopi (BCC)" },
  replyTo: { label: "Svar til" },
  emailFrom: {
    label: "Avsender (valgfritt)",
    description: "La stå tom for å bruke standardavsenderen.",
  },
  subject: { label: "Emne" },
  message: {
    label: "Melding",
    description:
      "Selve e-posten. Skriv {{navn}} eller andre feltnavn i doble klammer for å flette inn svar fra skjemaet. Poynt-ramma (logo og farger) legges på automatisk.",
  },
};

// biome-ignore lint/suspicious/noExplicitAny: felt-typene fra pluginen er for løse til å bevare her
function relabelFormEmailFields(fields: any[]): any[] {
  return fields.map((field) => {
    if (field.type === "row" && Array.isArray(field.fields)) {
      return { ...field, fields: relabelFormEmailFields(field.fields) };
    }
    const override = field.name
      ? FORM_EMAIL_FIELD_LABELS[field.name as string]
      : undefined;
    if (!override) return field;
    return {
      ...field,
      label: override.label,
      admin: {
        ...field.admin,
        ...(override.description
          ? { description: override.description }
          : undefined),
      },
    };
  });
}

export default buildConfig({
  editor: lexicalEditor({}),
  secret: payloadSecret,
  serverURL: siteUrl,
  // Avsender for e-poster Payload selv sender (i praksis skjema-e-postene fra
  // form-builder-pluginen). Bruker samme EMAIL_FROM som @poynt/email, slik at
  // alt går fra samme verifiserte adresse. Uten EMAIL_FROM: Resend-sandboxen,
  // som bare leverer til kontoens egen adresse.
  email: resendAdapter({
    defaultFromName: emailFromParts.name,
    defaultFromAddress: emailFromParts.address,
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
  // Admin-grensesnittet er norsk (bokmål) — uten dette faller Payload tilbake
  // på engelsk, og innebygde strenger blir «Add Layout» i stedet for
  // «Legg til blokk». Kun nb er støttet, så språkvelgeren i profilen forsvinner.
  i18n: {
    supportedLanguages: { nb },
    fallbackLanguage: "nb",
    // seo- og form-builder-pluginene har egne nb-filer, men redirects-pluginen
    // har bare en håndfull språk (en/es/fr/ja/pt/sv). Uten disse logger Payload
    // «key not found: plugin-redirects:…» og viser nøkkelnavnet som felt-label.
    translations: {
      nb: {
        "plugin-redirects": {
          customUrl: "Egen URL",
          documentToRedirect: "Dokument det skal omdirigeres til",
          fromUrl: "Fra URL",
          internalLink: "Intern lenke",
          redirectType: "Type omdirigering",
          toUrlType: "Type mål",
        },
      },
      // biome-ignore lint/suspicious/noExplicitAny: plugin-nøkkelrom er ikke typet i Payload
    } as any,
  },
  collections: [
    // Innhold
    Pages,
    BlogPosts,
    CaseStudies,
    Services,
    Categories,
    Media,
    Newsletters,
    EmailTemplates,
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
    OnPoyntFeatures,
  ],
  admin: {
    user: "users",
    components: {
      afterNavLinks: [
        "/admin/components/on-poynt-nav-group#OnPoyntNavGroup",
        "/admin/components/contacts-nav-group#ContactsNavGroup",
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
        email: {
          Component: "/admin/views/email/list#EmailOverviewView",
          path: "/epost",
          exact: true,
          meta: { title: "E-post" },
        },
        contacts: {
          Component: "/admin/views/contacts/list#ContactsListView",
          path: "/kontakter",
          exact: true,
          meta: { title: "Kontakter" },
        },
        quality: {
          Component: "/admin/views/quality/list#QualityListView",
          path: "/kvalitet",
          exact: true,
          meta: { title: "Kvalitetsoversikt" },
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
      collections: [
        "pages",
        "products",
        "blog-posts",
        "case-studies",
        "services",
      ],
      uploadsCollection: "media",
      // «| Poynt»-suffikset legges på automatisk i frontend (title.template),
      // så meta-tittelen lagres uten suffiks for å unngå dobbel «| Poynt».
      // Tjenester har `name`/`shortDescription` i stedet for tittel/utdrag.
      generateTitle: ({ doc }) => doc.title || doc.name,
      generateDescription: ({ doc }) =>
        doc.excerpt || doc.shortDescription || "",
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
        if (collectionSlug === "services") {
          return `${siteUrl}/tjenester/${doc.slug}`;
        }
        return `${siteUrl}/${collectionSlug}/${doc.slug}`;
      },
      tabbedUI: true,
      fields: ({ defaultFields }) => [
        // Pluginets egen «Preview» (kun URL/tekst, uten bilde) byttes ut med
        // vår egen SeoPreview (Google-treff + delingskort med bilde) på samme
        // plass i skjemaet. Tittel/beskrivelse får hjelpetekst om fallbacken:
        // frontend bruker innholdets tittel og utdrag når feltene står tomme.
        ...defaultFields.map((field) => {
          if (!("name" in field)) return field;
          if (field.name === "preview") {
            return {
              name: "seoPreview",
              type: "ui",
              admin: {
                components: {
                  Field: "/admin/components/seo/seo-preview#SeoPreview",
                },
              },
            } as const;
          }
          if (field.name === "title") {
            return {
              ...field,
              admin: {
                ...field.admin,
                description:
                  "Kan stå tom — da bruker Google innholdets egen tittel. Fyll ut hvis søketreffet skal si noe annet enn overskriften på siden.",
              },
            } as typeof field;
          }
          if (field.name === "description") {
            return {
              ...field,
              admin: {
                ...field.admin,
                description:
                  "Kan stå tom — da brukes utdraget/den korte oppsummeringen fra innholdet. (Sider har ikke utdrag, så der bør denne fylles ut.)",
              },
            } as typeof field;
          }
          if (field.name === "image") {
            return {
              ...field,
              admin: {
                ...field.admin,
                description:
                  "Kan stå tom — da brukes hovedbildet (eller hero-bildet på Sider), og uten det lages et automatisk Poynt-kort med tittelen.",
              },
            } as typeof field;
          }
          return field;
        }),
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
      collections: [
        "pages",
        "products",
        "blog-posts",
        "case-studies",
        "services",
      ],
      overrides: {
        admin: {
          // Ligger i den egenbygde «Drift»-nav-gruppen (setup-nav-group.tsx),
          // ikke i Payloads standard-nav.
          group: false,
        },
        labels: {
          singular: "Omdirigering",
          plural: "Omdirigeringer",
        },
        // checkRedirect leses bak cacheTag("cms") — uten disse slår en ny
        // omdirigering først gjennom når cachen utløper.
        hooks: {
          afterChange: [revalidateCmsAfterChange],
          afterDelete: [revalidateCmsAfterDelete],
        },
      },
    }),
    formBuilderPlugin({
      // Skjema-e-postene («E-poster ved innsending») skrives i admin, men
      // pluginen sender dem som naken HTML fra standardavsenderen. Legg på
      // Poynt-ramma her, slik at de ser ut som resten av e-postene våre.
      beforeEmail: async (emails) => {
        const { renderFormEmailHtml } = await import("@poynt/email");
        return Promise.all(
          emails.map(async (email) => ({
            ...email,
            html: await renderFormEmailHtml({
              preview: email.subject,
              contentHtml: email.html,
            }),
          }))
        );
      },
      formOverrides: {
        admin: {
          group: "Kommunikasjon",
        },
        labels: {
          singular: "Skjema",
          plural: "Skjemaer",
        },
        // Skjema-redigeringen ryddes i faner: Oppbygging / Etter innsending /
        // E-poster / Forhåndsvisning (unavngitte tabs — ingen skjemaendring).
        // Felt- og e-postlistene starter sammenslått for bedre oversikt.
        fields: ({ defaultFields }) => {
          type FormField = (typeof defaultFields)[number];
          const byName = new Map<string, FormField>();
          for (const field of defaultFields) {
            if ("name" in field && typeof field.name === "string") {
              byName.set(field.name, field);
            }
          }
          const take = (name: string): FormField[] => {
            const field = byName.get(name);
            if (!field) return [];
            byName.delete(name);
            return [field];
          };
          const collapsed = (field: FormField): FormField =>
            ({
              ...field,
              admin: {
                ...("admin" in field ? field.admin : undefined),
                initCollapsed: true,
              },
            }) as FormField;

          const emailsField = take("emails").map((field) =>
            "fields" in field
              ? (collapsed({
                  ...field,
                  label: "E-poster ved innsending",
                  labels: { singular: "E-post", plural: "E-poster" },
                  admin: {
                    ...field.admin,
                    description:
                      "E-poster som sendes automatisk når noen sender inn skjemaet — f.eks. en bekreftelse til innsenderen. Se resultatet i «Forhåndsvisning»-fanen.",
                  },
                  fields: relabelFormEmailFields(field.fields),
                } as typeof field) as FormField)
              : field
          );

          const title = take("title");
          const structureFields = [
            ...take("fields").map(collapsed),
            ...take("submitButtonLabel"),
          ];
          const afterSubmitFields = [
            ...take("confirmationType"),
            ...take("confirmationMessage"),
            ...take("redirect"),
          ];
          // Eventuelle nye plugin-felter vi ikke kjenner havner i første fane
          // i stedet for å forsvinne stille.
          const leftovers = [...byName.values()];

          return [
            ...title,
            {
              type: "tabs",
              tabs: [
                {
                  label: "Oppbygging",
                  fields: [...structureFields, ...leftovers],
                },
                {
                  label: "Etter innsending",
                  description:
                    "Hva innsenderen ser på skjermen rett etter å ha sendt inn.",
                  fields: afterSubmitFields,
                },
                {
                  label: "E-poster",
                  fields: emailsField,
                },
                {
                  label: "Forhåndsvisning",
                  description:
                    "E-postene fra «E-poster»-fanen slik de ser ut hos mottakeren — oppdateres mens du skriver.",
                  fields: [
                    {
                      name: "emailsPreview",
                      type: "ui",
                      admin: {
                        components: {
                          Field:
                            "/admin/components/email/form-emails-preview#FormEmailsPreview",
                        },
                      },
                    },
                  ],
                },
              ],
            } as FormField,
          ];
        },
        // Skjemafeltene leses bak cacheTag("cms") (lib/contact.ts) — uten
        // dette slår skjemaendringer først gjennom når cachen utløper.
        hooks: {
          afterChange: [revalidateCmsAfterChange],
          afterDelete: [revalidateCmsAfterDelete],
        },
      },
      formSubmissionOverrides: {
        // Pluginens standard er create: () => true (nødvendig — skjemaene er
        // offentlige), men helt uten brems kan endepunktet spammes: hver
        // innsending sender e-post via Resend og kan speiles til medlemssøknad.
        access: {
          create: ({ req }) => {
            const ip =
              req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
              req.headers.get("x-real-ip") ??
              "ukjent";
            return rateLimit("form-submission", ip, {
              limit: 5,
              windowMs: 10 * 60_000,
            });
          },
        },
        admin: {
          group: "Kommunikasjon",
          defaultColumns: ["form", "createdAt"],
        },
        labels: {
          singular: "Innsending",
          plural: "Innsendinger",
        },
        // Pen visning øverst (submission-view.tsx) — pluginens rå
        // felt/verdi-liste beholdes under, men låses for redigering
        // (innsendt data skal ikke endres i etterkant).
        fields: ({ defaultFields }) => [
          {
            name: "innsendingsvisning",
            type: "ui",
            admin: {
              components: {
                Field: "/admin/components/submission-view#SubmissionView",
              },
            },
          },
          ...defaultFields.map((field) =>
            "name" in field && field.name === "submissionData"
              ? ({
                  ...field,
                  admin: {
                    ...field.admin,
                    readOnly: true,
                    description:
                      "Rådataene fra skjemaet — samme svar som i oversikten over.",
                  },
                } as typeof field)
              : field
          ),
        ],
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

                // Venteliste-skjemaer kjennes igjen på tittelen («Venteliste
                // – …»), ikke på feltnavn: de har bare navn/e-post, som er for
                // generisk til å skille dem fra andre skjemaer.
                const formId =
                  typeof doc.form === "object" ? doc.form?.id : doc.form;
                if (formId) {
                  const { handleWaitlistSubmission, isWaitlistFormTitle } =
                    await import("./lib/waitlist");
                  const formDoc = await req.payload.findByID({
                    collection: "forms",
                    id: formId,
                    depth: 0,
                  });
                  if (isWaitlistFormTitle(formDoc?.title)) {
                    await handleWaitlistSubmission({
                      req,
                      formTitle: formDoc.title,
                      formId,
                      get,
                      // Har skjemaet en egen bekreftelse under «E-poster ved
                      // innsending», sender pluginen den — da skal ikke
                      // standardbekreftelsen i koden også sendes.
                      hasOwnConfirmation:
                        Array.isArray(formDoc.emails) &&
                        formDoc.emails.length > 0,
                    });
                    return doc;
                  }
                }

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
                    // Søknaden dukker da ALDRI opp i Søknader-innboksen — si
                    // fra til oss på e-post i tillegg til loggen, med peker til
                    // innsendingen så den kan legges inn manuelt.
                    req.payload.logger.error(
                      `Lagring av medlemskapssøknad feilet: ${dbErr instanceof Error ? dbErr.message : dbErr}`
                    );
                    try {
                      const { getNotificationEmails } = await import(
                        "./lib/notification-emails"
                      );
                      await sendContactEmails({
                        to: await getNotificationEmails(),
                        name: "Systemvarsel",
                        email: applicantEmail,
                        subject: "FEIL: medlemssøknad ikke lagret",
                        message: `Medlemskapssøknaden fra ${applicantEmail} ble IKKE lagret i Søknader-innboksen (databasefeil). Selve innsendingen ligger under Innsendinger (id ${doc.id}) — legg den inn manuelt eller be om ny søknad.\n\nFeil: ${dbErr instanceof Error ? dbErr.message : dbErr}`,
                      });
                    } catch (notifyErr) {
                      req.payload.logger.error(
                        `Varsel om feilet medlemssøknad feilet også: ${notifyErr instanceof Error ? notifyErr.message : notifyErr}`
                      );
                    }
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

                  const { getNotificationEmails } = await import(
                    "./lib/notification-emails"
                  );
                  await sendContactEmails({
                    to: await getNotificationEmails(),
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

                const { getNotificationEmails } = await import(
                  "./lib/notification-emails"
                );
                await sendContactEmails({
                  to: await getNotificationEmails(),
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
