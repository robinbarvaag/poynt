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
import { plannerSchema } from "./_schema";
import { plannerIndustry } from "./admin";
import { plannerUser } from "./auth";

/**
 * Workspace roles
 * - owner: Full access, can delete workspace, manage billing
 * - admin: Can edit settings, invite members
 * - member: Can use tools, see data
 * - client: Limited view access (for freelancer's clients)
 */
export const plannerWorkspaceRoleEnum = plannerSchema.enum(
  "planner_workspace_role",
  ["owner", "admin", "member", "client"]
);

/**
 * Subscription tiers
 */
export const plannerSubscriptionTierEnum = plannerSchema.enum(
  "planner_subscription_tier",
  ["none", "community", "community_ai"]
);

/**
 * Subscription status
 */
export const plannerSubscriptionStatusEnum = plannerSchema.enum(
  "planner_subscription_status",
  ["active", "inactive", "canceled", "past_due"]
);

/**
 * Company size options for workspace profile
 */
export const plannerCompanySizeEnum = plannerSchema.enum(
  "planner_company_size",
  [
    "solo", // Enmannsbedrift
    "small", // 2-10 ansatte
    "medium", // 11-50 ansatte
    "large", // 50+ ansatte
  ]
);

/**
 * Audience type - B2B, B2C or both
 */
export const plannerAudienceTypeEnum = plannerSchema.enum(
  "planner_audience_type",
  [
    "b2b", // Bedrifter
    "b2c", // Forbrukere
    "both", // Begge deler
  ]
);

/**
 * Workspace - represents a "bedrift" or client account
 */
export const plannerWorkspace = plannerSchema.table(
  "planner_workspace",
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
  (table) => [index("planner_workspace_slug_idx").on(table.slug)]
);

/**
 * Workspace member - links users to workspaces with roles
 */
export const plannerWorkspaceMember = plannerSchema.table(
  "planner_workspace_member",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => plannerWorkspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    role: plannerWorkspaceRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("planner_workspace_member_unique_idx").on(
      table.workspaceId,
      table.userId
    ),
    index("planner_workspace_member_workspace_idx").on(table.workspaceId),
    index("planner_workspace_member_user_idx").on(table.userId),
  ]
);

/**
 * Workspace invitation - pending invites
 */
export const plannerWorkspaceInvitation = plannerSchema.table(
  "planner_workspace_invitation",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => plannerWorkspace.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: plannerWorkspaceRoleEnum("role").notNull().default("member"),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("planner_workspace_invitation_token_idx").on(table.token),
    index("planner_workspace_invitation_email_idx").on(table.email),
  ]
);

/**
 * User subscription - tracks user's subscription tier
 */
export const plannerSubscription = plannerSchema.table(
  "planner_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" })
      .unique(),
    tier: plannerSubscriptionTierEnum("tier").notNull().default("none"),
    status: plannerSubscriptionStatusEnum("status").notNull().default("active"),
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
    index("planner_subscription_user_idx").on(table.userId),
    index("planner_subscription_stripe_customer_idx").on(
      table.stripeCustomerId
    ),
  ]
);

/**
 * User preferences - stores active workspace and other settings
 */
export const plannerUserPreferences = plannerSchema.table(
  "planner_user_preferences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" })
      .unique(),
    activeWorkspaceId: text("active_workspace_id").references(
      () => plannerWorkspace.id,
      {
        onDelete: "set null",
      }
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
);

/**
 * Workspace Profile - Extended info about the workspace/business
 * Used across all tools for consistent context
 */
export const plannerWorkspaceProfile = plannerSchema.table(
  "planner_workspace_profile",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => plannerWorkspace.id, { onDelete: "cascade" })
      .unique(), // 1:1 relationship with workspace
    industryId: text("industry_id").references(() => plannerIndustry.id, {
      onDelete: "set null",
    }),
    targetAudience: text("target_audience"), // Freetext description of target customers
    audienceType: plannerAudienceTypeEnum("audience_type"), // B2B, B2C or both
    companySize: plannerCompanySizeEnum("company_size"),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("planner_workspace_profile_workspace_idx").on(table.workspaceId),
    index("planner_workspace_profile_industry_idx").on(table.industryId),
  ]
);

/**
 * Tool Result - Stores results from AI tools for history and reuse
 */
export const plannerToolResult = plannerSchema.table(
  "planner_tool_result",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => plannerWorkspace.id, { onDelete: "cascade" }),
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
    index("planner_tool_result_workspace_idx").on(table.workspaceId),
    index("planner_tool_result_tool_idx").on(table.toolId),
    index("planner_tool_result_created_idx").on(table.createdAt),
  ]
);

/**
 * Decline Generator Feedback - Track user feedback and variant usage
 */
export const plannerDeclineGeneratorFeedback = plannerSchema.table(
  "planner_decline_generator_feedback",
  {
    id: text("id").primaryKey(),
    toolResultId: text("tool_result_id")
      .notNull()
      .references(() => plannerToolResult.id, { onDelete: "cascade" }),
    variantCopied: text("variant_copied"), // "kort" | "varm" | "alternativ"
    worked: boolean("worked"), // true = thumbs up, false = thumbs down, null = not rated
    customVersion: text("custom_version"), // User's own version if they edited it
    feedbackText: text("feedback_text"), // Optional comment
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("planner_decline_feedback_tool_result_idx").on(table.toolResultId),
  ]
);

/**
 * Task - Et førsteklasses, avhukbart gjøremål. Bindeleddet mellom verktøyene:
 * markedsplanen (og andre) materialiserer oppgaver hit, og dashbordet + verktøyet
 * viser/huker dem av. Hver oppgave er en egen rad med tittel (ikke index-basert
 * fremgang knyttet til ett resultat), så den kan vises hvor som helst.
 */
export const plannerTask = plannerSchema.table(
  "planner_task",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => plannerWorkspace.id, { onDelete: "cascade" }),
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
    index("planner_task_workspace_idx").on(table.workspaceId),
    index("planner_task_done_idx").on(table.done),
    index("planner_task_source_idx").on(table.source),
  ]
);

export type PlannerTask = typeof plannerTask.$inferSelect;
export type NewPlannerTask = typeof plannerTask.$inferInsert;

// Relations
export const plannerWorkspaceRelations = relations(
  plannerWorkspace,
  ({ many, one }) => ({
    members: many(plannerWorkspaceMember),
    invitations: many(plannerWorkspaceInvitation),
    profile: one(plannerWorkspaceProfile),
    toolResults: many(plannerToolResult),
    tasks: many(plannerTask),
  })
);

export const plannerTaskRelations = relations(plannerTask, ({ one }) => ({
  workspace: one(plannerWorkspace, {
    fields: [plannerTask.workspaceId],
    references: [plannerWorkspace.id],
  }),
}));

export const plannerWorkspaceMemberRelations = relations(
  plannerWorkspaceMember,
  ({ one }) => ({
    workspace: one(plannerWorkspace, {
      fields: [plannerWorkspaceMember.workspaceId],
      references: [plannerWorkspace.id],
    }),
    user: one(plannerUser, {
      fields: [plannerWorkspaceMember.userId],
      references: [plannerUser.id],
    }),
  })
);

export const plannerWorkspaceInvitationRelations = relations(
  plannerWorkspaceInvitation,
  ({ one }) => ({
    workspace: one(plannerWorkspace, {
      fields: [plannerWorkspaceInvitation.workspaceId],
      references: [plannerWorkspace.id],
    }),
    invitedBy: one(plannerUser, {
      fields: [plannerWorkspaceInvitation.invitedById],
      references: [plannerUser.id],
    }),
  })
);

export const plannerSubscriptionRelations = relations(
  plannerSubscription,
  ({ one }) => ({
    user: one(plannerUser, {
      fields: [plannerSubscription.userId],
      references: [plannerUser.id],
    }),
  })
);

export const plannerUserPreferencesRelations = relations(
  plannerUserPreferences,
  ({ one }) => ({
    user: one(plannerUser, {
      fields: [plannerUserPreferences.userId],
      references: [plannerUser.id],
    }),
    activeWorkspace: one(plannerWorkspace, {
      fields: [plannerUserPreferences.activeWorkspaceId],
      references: [plannerWorkspace.id],
    }),
  })
);

export const plannerWorkspaceProfileRelations = relations(
  plannerWorkspaceProfile,
  ({ one }) => ({
    workspace: one(plannerWorkspace, {
      fields: [plannerWorkspaceProfile.workspaceId],
      references: [plannerWorkspace.id],
    }),
    industry: one(plannerIndustry, {
      fields: [plannerWorkspaceProfile.industryId],
      references: [plannerIndustry.id],
    }),
  })
);

export const plannerToolResultRelations = relations(
  plannerToolResult,
  ({ one, many }) => ({
    workspace: one(plannerWorkspace, {
      fields: [plannerToolResult.workspaceId],
      references: [plannerWorkspace.id],
    }),
    feedback: many(plannerDeclineGeneratorFeedback),
  })
);

export const plannerDeclineGeneratorFeedbackRelations = relations(
  plannerDeclineGeneratorFeedback,
  ({ one }) => ({
    toolResult: one(plannerToolResult, {
      fields: [plannerDeclineGeneratorFeedback.toolResultId],
      references: [plannerToolResult.id],
    }),
  })
);

// Type exports
export type PlannerWorkspace = typeof plannerWorkspace.$inferSelect;
export type NewPlannerWorkspace = typeof plannerWorkspace.$inferInsert;
export type PlannerWorkspaceMember = typeof plannerWorkspaceMember.$inferSelect;
export type NewPlannerWorkspaceMember =
  typeof plannerWorkspaceMember.$inferInsert;
export type PlannerWorkspaceInvitation =
  typeof plannerWorkspaceInvitation.$inferSelect;
export type NewPlannerWorkspaceInvitation =
  typeof plannerWorkspaceInvitation.$inferInsert;
export type PlannerSubscription = typeof plannerSubscription.$inferSelect;
export type NewPlannerSubscription = typeof plannerSubscription.$inferInsert;
export type PlannerUserPreferences = typeof plannerUserPreferences.$inferSelect;
export type NewPlannerUserPreferences =
  typeof plannerUserPreferences.$inferInsert;
export type PlannerWorkspaceProfile =
  typeof plannerWorkspaceProfile.$inferSelect;
export type NewPlannerWorkspaceProfile =
  typeof plannerWorkspaceProfile.$inferInsert;
export type PlannerToolResult = typeof plannerToolResult.$inferSelect;
export type NewPlannerToolResult = typeof plannerToolResult.$inferInsert;
export type PlannerDeclineGeneratorFeedback =
  typeof plannerDeclineGeneratorFeedback.$inferSelect;
export type NewPlannerDeclineGeneratorFeedback =
  typeof plannerDeclineGeneratorFeedback.$inferInsert;
