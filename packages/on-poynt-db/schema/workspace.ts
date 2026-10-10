import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { onPoyntSchema } from "./_schema";
import { onPoyntIndustry } from "./admin";
import { onPoyntUser } from "./auth";

/**
 * Workspace roles
 * - owner: Full access, can delete workspace, manage billing
 * - admin: Can edit settings, invite members
 * - member: Can use tools, see data
 * - client: Limited view access (for freelancer's clients)
 */
export const onPoyntWorkspaceRoleEnum = onPoyntSchema.enum("workspace_role", [
  "owner",
  "admin",
  "member",
  "client",
]);

/**
 * Subscription tiers
 */
export const onPoyntSubscriptionTierEnum = onPoyntSchema.enum(
  "subscription_tier",
  ["none", "community", "community_ai", "agency"]
);

/**
 * Subscription status
 */
export const onPoyntSubscriptionStatusEnum = onPoyntSchema.enum(
  "subscription_status",
  ["active", "inactive", "canceled", "past_due"]
);

/**
 * Company size options for workspace profile
 */
export const onPoyntCompanySizeEnum = onPoyntSchema.enum("company_size", [
  "solo", // Enmannsbedrift
  "small", // 2-10 ansatte
  "medium", // 11-50 ansatte
  "large", // 50+ ansatte
]);

/**
 * Audience type - B2B, B2C or both
 */
export const onPoyntAudienceTypeEnum = onPoyntSchema.enum("audience_type", [
  "b2b", // Bedrifter
  "b2c", // Forbrukere
  "both", // Begge deler
]);

/**
 * Workspace - represents a "bedrift" or client account
 */
export const onPoyntWorkspace = onPoyntSchema.table(
  "workspace",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("workspace_slug_idx").on(table.slug)]
);

/**
 * Workspace member - links users to workspaces with roles
 */
export const onPoyntWorkspaceMember = onPoyntSchema.table(
  "workspace_member",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => onPoyntWorkspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    role: onPoyntWorkspaceRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("workspace_member_unique_idx").on(
      table.workspaceId,
      table.userId
    ),
    index("workspace_member_workspace_idx").on(table.workspaceId),
    index("workspace_member_user_idx").on(table.userId),
  ]
);

/**
 * Workspace invitation - pending invites
 */
export const onPoyntWorkspaceInvitation = onPoyntSchema.table(
  "workspace_invitation",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => onPoyntWorkspace.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: onPoyntWorkspaceRoleEnum("role").notNull().default("member"),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("workspace_invitation_token_idx").on(table.token),
    index("workspace_invitation_email_idx").on(table.email),
  ]
);

/**
 * User subscription - tracks user's subscription tier
 */
export const onPoyntSubscription = onPoyntSchema.table(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" })
      .unique(),
    tier: onPoyntSubscriptionTierEnum("tier").notNull().default("none"),
    status: onPoyntSubscriptionStatusEnum("status").notNull().default("active"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_user_idx").on(table.userId),
    index("subscription_stripe_customer_idx").on(table.stripeCustomerId),
  ]
);

/**
 * User preferences - stores active workspace and other settings
 */
export const onPoyntUserPreferences = onPoyntSchema.table("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => onPoyntUser.id, { onDelete: "cascade" })
    .unique(),
  activeWorkspaceId: text("active_workspace_id").references(
    () => onPoyntWorkspace.id,
    {
      onDelete: "set null",
    }
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Workspace Profile - Extended info about the workspace/business
 * Used across all tools for consistent context
 */
export const onPoyntWorkspaceProfile = onPoyntSchema.table(
  "workspace_profile",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => onPoyntWorkspace.id, { onDelete: "cascade" })
      .unique(), // 1:1 relationship with workspace
    // Organisasjonsnummer (Brønnøysund) — lar oss forhåndsfylle profilen og slå
    // opp bedriften på nytt for oppdaterte tall.
    orgNumber: text("org_number"),
    industryId: text("industry_id").references(() => onPoyntIndustry.id, {
      onDelete: "set null",
    }),
    targetAudience: text("target_audience"), // Freetext description of target customers
    audienceType: onPoyntAudienceTypeEnum("audience_type"), // B2B, B2C or both
    companySize: onPoyntCompanySizeEnum("company_size"),
    goals: jsonb("goals").$type<string[]>(), // Marketing goals (freetext context)
    // Varige verktøy-input flyttet inn i profilen («felles hjerne») slik at
    // verktøyene slipper å spørre om dem på nytt. Lagres som text + valideres
    // med zod-enums i app-laget (holder migrasjonen additiv og enkel).
    mainGoal: text("main_goal"), // leads | sales | awareness | recruitment
    weeklyTime: text("weekly_time"), // 1-2h | 3-5h | 5h+
    strengths: text("strengths"), // writing | speaking | visual | mixed
    customContext: text("custom_context"), // Extra context for AI prompts
    // «Felles hjerne 2.0» — rik merkevarebrief (stemme, USP, kjernebudskap),
    // typisk generert fra bedriftens nettside. Injiseres i alle AI-verktøyene.
    // Strukturen valideres med zod (brandBriefSchema) i app-laget.
    brandBrief: jsonb("brand_brief").$type<{
      toneOfVoice?: string | null;
      phrasesWeUse?: string[] | null;
      phrasesWeAvoid?: string[] | null;
      coreMessage?: string | null;
      usp?: string | null;
      audienceInsight?: string | null;
      visualStyle?: string | null;
      sourceUrl?: string | null;
    }>(),
    // Visuell merkevare-identitet («merkevare-boka») — brukerstyrt: logo, farger,
    // fonter, tagline, moodboard. Skilt fra brandBrief så den visuelle identiteten
    // og den AI-genererte stemmen lagres uavhengig. Valideres med brandIdentitySchema.
    brandIdentity: jsonb("brand_identity").$type<{
      logoUrl?: string | null;
      logoDarkUrl?: string | null;
      tagline?: string | null;
      colors?:
        | { hex: string; name?: string | null; role?: string | null }[]
        | null;
      fonts?: {
        heading?: string | null;
        body?: string | null;
        accent?: string | null;
      } | null;
      imagery?: string[] | null;
    }>(),
    // Bedriftens podkast-RSS-feed — lar «Podcast til innhold» forhåndsfylle
    // feltet og auto-liste episoder uten å lime inn lenken på nytt.
    podcastFeedUrl: text("podcast_feed_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workspace_profile_workspace_idx").on(table.workspaceId),
    index("workspace_profile_industry_idx").on(table.industryId),
  ]
);

/**
 * Tool Result - Stores results from AI tools for history and reuse
 */
export const onPoyntToolResult = onPoyntSchema.table(
  "tool_result",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => onPoyntWorkspace.id, { onDelete: "cascade" }),
    toolId: text("tool_id").notNull(), // "channel-guide" | "decline-generator" | "marketing-plan" | "yearly-planner"
    title: text("title"), // User-friendly title for the result
    inputs: jsonb("inputs").$type<Record<string, unknown>>(), // What the user entered
    result: jsonb("result").$type<Record<string, unknown>>(), // The AI response
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tool_result_workspace_idx").on(table.workspaceId),
    index("tool_result_tool_idx").on(table.toolId),
    index("tool_result_created_idx").on(table.createdAt),
  ]
);

/**
 * Decline Generator Feedback - Track user feedback and variant usage
 */
export const onPoyntDeclineGeneratorFeedback = onPoyntSchema.table(
  "decline_generator_feedback",
  {
    id: text("id").primaryKey(),
    toolResultId: text("tool_result_id")
      .notNull()
      .references(() => onPoyntToolResult.id, { onDelete: "cascade" }),
    variantCopied: text("variant_copied"), // "kort" | "varm" | "alternativ"
    worked: boolean("worked"), // true = thumbs up, false = thumbs down, null = not rated
    customVersion: text("custom_version"), // User's own version if they edited it
    feedbackText: text("feedback_text"), // Optional comment
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("decline_feedback_tool_result_idx").on(table.toolResultId)]
);

/**
 * Task - Et førsteklasses, avhukbart gjøremål. Bindeleddet mellom verktøyene:
 * markedsplanen (og andre) materialiserer oppgaver hit, og dashbordet + verktøyet
 * viser/huker dem av. Hver oppgave er en egen rad med tittel (ikke index-basert
 * fremgang knyttet til ett resultat), så den kan vises hvor som helst.
 */
export const onPoyntTask = onPoyntSchema.table(
  "task",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => onPoyntWorkspace.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    note: text("note"),
    // Hvor oppgaven kom fra: "manual" | "marketing-plan" | "yearly-planner" | …
    source: text("source").notNull().default("manual"),
    // Grupperingsetikett, f.eks. «Quick win», «Mars», «Ukentlig rutine».
    category: text("category"),
    done: boolean("done").notNull().default(false),
    doneAt: timestamp("done_at"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_workspace_idx").on(table.workspaceId),
    index("task_done_idx").on(table.done),
    index("task_source_idx").on(table.source),
  ]
);

export type OnPoyntTask = typeof onPoyntTask.$inferSelect;
export type NewOnPoyntTask = typeof onPoyntTask.$inferInsert;

// Relations
export const onPoyntWorkspaceRelations = relations(
  onPoyntWorkspace,
  ({ many, one }) => ({
    members: many(onPoyntWorkspaceMember),
    invitations: many(onPoyntWorkspaceInvitation),
    profile: one(onPoyntWorkspaceProfile),
    toolResults: many(onPoyntToolResult),
    tasks: many(onPoyntTask),
  })
);

export const onPoyntTaskRelations = relations(onPoyntTask, ({ one }) => ({
  workspace: one(onPoyntWorkspace, {
    fields: [onPoyntTask.workspaceId],
    references: [onPoyntWorkspace.id],
  }),
}));

export const onPoyntWorkspaceMemberRelations = relations(
  onPoyntWorkspaceMember,
  ({ one }) => ({
    workspace: one(onPoyntWorkspace, {
      fields: [onPoyntWorkspaceMember.workspaceId],
      references: [onPoyntWorkspace.id],
    }),
    user: one(onPoyntUser, {
      fields: [onPoyntWorkspaceMember.userId],
      references: [onPoyntUser.id],
    }),
  })
);

export const onPoyntWorkspaceInvitationRelations = relations(
  onPoyntWorkspaceInvitation,
  ({ one }) => ({
    workspace: one(onPoyntWorkspace, {
      fields: [onPoyntWorkspaceInvitation.workspaceId],
      references: [onPoyntWorkspace.id],
    }),
    invitedBy: one(onPoyntUser, {
      fields: [onPoyntWorkspaceInvitation.invitedById],
      references: [onPoyntUser.id],
    }),
  })
);

export const onPoyntSubscriptionRelations = relations(
  onPoyntSubscription,
  ({ one }) => ({
    user: one(onPoyntUser, {
      fields: [onPoyntSubscription.userId],
      references: [onPoyntUser.id],
    }),
  })
);

export const onPoyntUserPreferencesRelations = relations(
  onPoyntUserPreferences,
  ({ one }) => ({
    user: one(onPoyntUser, {
      fields: [onPoyntUserPreferences.userId],
      references: [onPoyntUser.id],
    }),
    activeWorkspace: one(onPoyntWorkspace, {
      fields: [onPoyntUserPreferences.activeWorkspaceId],
      references: [onPoyntWorkspace.id],
    }),
  })
);

export const onPoyntWorkspaceProfileRelations = relations(
  onPoyntWorkspaceProfile,
  ({ one }) => ({
    workspace: one(onPoyntWorkspace, {
      fields: [onPoyntWorkspaceProfile.workspaceId],
      references: [onPoyntWorkspace.id],
    }),
    industry: one(onPoyntIndustry, {
      fields: [onPoyntWorkspaceProfile.industryId],
      references: [onPoyntIndustry.id],
    }),
  })
);

export const onPoyntToolResultRelations = relations(
  onPoyntToolResult,
  ({ one, many }) => ({
    workspace: one(onPoyntWorkspace, {
      fields: [onPoyntToolResult.workspaceId],
      references: [onPoyntWorkspace.id],
    }),
    feedback: many(onPoyntDeclineGeneratorFeedback),
  })
);

export const onPoyntDeclineGeneratorFeedbackRelations = relations(
  onPoyntDeclineGeneratorFeedback,
  ({ one }) => ({
    toolResult: one(onPoyntToolResult, {
      fields: [onPoyntDeclineGeneratorFeedback.toolResultId],
      references: [onPoyntToolResult.id],
    }),
  })
);

// Type exports
export type OnPoyntWorkspace = typeof onPoyntWorkspace.$inferSelect;
export type NewOnPoyntWorkspace = typeof onPoyntWorkspace.$inferInsert;
export type OnPoyntWorkspaceMember = typeof onPoyntWorkspaceMember.$inferSelect;
export type NewOnPoyntWorkspaceMember =
  typeof onPoyntWorkspaceMember.$inferInsert;
export type OnPoyntWorkspaceInvitation =
  typeof onPoyntWorkspaceInvitation.$inferSelect;
export type NewOnPoyntWorkspaceInvitation =
  typeof onPoyntWorkspaceInvitation.$inferInsert;
export type OnPoyntSubscription = typeof onPoyntSubscription.$inferSelect;
export type NewOnPoyntSubscription = typeof onPoyntSubscription.$inferInsert;
export type OnPoyntUserPreferences = typeof onPoyntUserPreferences.$inferSelect;
export type NewOnPoyntUserPreferences =
  typeof onPoyntUserPreferences.$inferInsert;
export type OnPoyntWorkspaceProfile =
  typeof onPoyntWorkspaceProfile.$inferSelect;
export type NewOnPoyntWorkspaceProfile =
  typeof onPoyntWorkspaceProfile.$inferInsert;
export type OnPoyntToolResult = typeof onPoyntToolResult.$inferSelect;
export type NewOnPoyntToolResult = typeof onPoyntToolResult.$inferInsert;
export type OnPoyntDeclineGeneratorFeedback =
  typeof onPoyntDeclineGeneratorFeedback.$inferSelect;
export type NewOnPoyntDeclineGeneratorFeedback =
  typeof onPoyntDeclineGeneratorFeedback.$inferInsert;
