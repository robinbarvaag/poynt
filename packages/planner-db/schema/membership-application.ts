import { relations } from "drizzle-orm";
import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";
import { plannerSchema } from "./_schema";
import { plannerUser } from "./auth";
import {
  plannerAudienceTypeEnum,
  plannerCompanySizeEnum,
  plannerSubscriptionTierEnum,
} from "./workspace";

/**
 * Status for en medlemskapssøknad.
 * - pending: nettopp sendt inn, venter på behandling
 * - approved: godkjent – medlem + abonnement er opprettet
 * - rejected: avslått
 */
export const plannerApplicationStatusEnum = plannerSchema.enum(
  "planner_application_status",
  ["pending", "approved", "rejected"]
);

/**
 * Medlemskapssøknad – On Poynt.
 *
 * Folk søker om medlemskap via /bli-medlem (form-builder-skjema). Innsendingen
 * speiles hit av afterChange-hook-en på form_submissions slik at partneren får
 * en strukturert «pending → godkjenn»-innboks i admin (On Poynt → Søknader).
 *
 * On-Poynt-profilfeltene (bransje/bedriftsstørrelse/målgruppe) tas vare på her
 * og forhåndsutfyller medlemmets `planner_workspace_profile` når de senere
 * oppretter arbeidsområdet sitt i onboardingen.
 *
 * Ligger i `planner`-schemaet sammen med resten av medlemsdomenet, så
 * godkjenning (opprett bruker + abonnement) skjer i samme database.
 */
export const plannerMembershipApplication = plannerSchema.table(
  "planner_membership_application",
  {
    id: text("id").primaryKey(),
    status: plannerApplicationStatusEnum("status").notNull().default("pending"),

    // Søker
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    canonicalEmail: text("canonical_email").notNull(),

    // Bedrift / faktura (fra søknadsskjemaet)
    companyName: text("company_name"),
    orgNumber: text("org_number"),
    invoiceEmail: text("invoice_email"),
    revenueOver1m: text("revenue_over_1m"),
    ehfInvoice: text("ehf_invoice"),
    invoiceSplit: text("invoice_split"),
    invoiceNotes: text("invoice_notes"),
    aboutCompany: text("about_company"),

    // On-Poynt-profil (forhåndsutfylles på medlemmet ved onboarding).
    // industryId er fri tekst (ikke FK) fordi skjemaet er partner-redigerbart –
    // gyldigheten valideres mot planner_industry når den faktisk brukes.
    industryId: text("industry_id"),
    companySize: plannerCompanySizeEnum("company_size"),
    audienceType: plannerAudienceTypeEnum("audience_type"),
    targetAudience: text("target_audience"),

    // Sporing / råinnsending
    rawSubmission:
      jsonb("raw_submission").$type<{ field: string; value: string }[]>(),
    formSubmissionId: text("form_submission_id"),

    // Behandling
    approvedTier: plannerSubscriptionTierEnum("approved_tier"),
    userId: text("user_id").references(() => plannerUser.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("planner_membership_application_status_idx").on(table.status),
    index("planner_membership_application_email_idx").on(table.canonicalEmail),
    index("planner_membership_application_created_idx").on(table.createdAt),
  ]
);

export const plannerMembershipApplicationRelations = relations(
  plannerMembershipApplication,
  ({ one }) => ({
    user: one(plannerUser, {
      fields: [plannerMembershipApplication.userId],
      references: [plannerUser.id],
    }),
  })
);

export type PlannerMembershipApplication =
  typeof plannerMembershipApplication.$inferSelect;
export type NewPlannerMembershipApplication =
  typeof plannerMembershipApplication.$inferInsert;
