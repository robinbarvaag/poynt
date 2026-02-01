import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * User roles for admin access
 */
export const userRoles = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

/**
 * Better-auth required tables
 * These tables are managed by better-auth and should match the expected schema
 * All tables prefixed with planner_ to avoid conflicts with Payload CMS
 */

export const plannerUser = pgTable("planner_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").$type<UserRole>().default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const plannerSession = pgTable(
  "planner_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
  },
  (table) => [index("planner_session_userId_idx").on(table.userId)]
);

export const plannerAccount = pgTable(
  "planner_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("planner_account_userId_idx").on(table.userId)]
);

export const plannerVerification = pgTable(
  "planner_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("planner_verification_identifier_idx").on(table.identifier)]
);

// Relations
export const plannerUserRelations = relations(plannerUser, ({ many }) => ({
  sessions: many(plannerSession),
  accounts: many(plannerAccount),
}));

export const plannerSessionRelations = relations(plannerSession, ({ one }) => ({
  user: one(plannerUser, {
    fields: [plannerSession.userId],
    references: [plannerUser.id],
  }),
}));

export const plannerAccountRelations = relations(plannerAccount, ({ one }) => ({
  user: one(plannerUser, {
    fields: [plannerAccount.userId],
    references: [plannerUser.id],
  }),
}));

// Type exports
export type PlannerUser = typeof plannerUser.$inferSelect;
export type NewPlannerUser = typeof plannerUser.$inferInsert;
export type PlannerSession = typeof plannerSession.$inferSelect;
export type NewPlannerSession = typeof plannerSession.$inferInsert;
export type PlannerAccount = typeof plannerAccount.$inferSelect;
export type NewPlannerAccount = typeof plannerAccount.$inferInsert;
