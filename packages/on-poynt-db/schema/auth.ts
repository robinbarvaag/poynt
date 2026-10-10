import { relations } from "drizzle-orm";
import { boolean, index, text, timestamp } from "drizzle-orm/pg-core";
import { onPoyntSchema } from "./_schema";

/**
 * User roles for admin access
 */
export const userRoles = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

/**
 * Better-auth required tables
 * These tables are managed by better-auth and should match the expected schema
 * They live in the `on_poynt` schema, isolated from Payload CMS (`public`)
 */

export const onPoyntUser = onPoyntSchema.table(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    canonicalEmail: text("canonical_email").notNull().default(""),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: text("role").$type<UserRole>().default("user").notNull(),
    onboardingCompleted: boolean("onboarding_completed")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("user_canonical_email_idx").on(table.canonicalEmail)]
);

export const onPoyntSession = onPoyntSchema.table(
  "session",
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
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const onPoyntAccount = onPoyntSchema.table(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
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
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const onPoyntVerification = onPoyntSchema.table(
  "verification",
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
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// Relations
export const onPoyntUserRelations = relations(onPoyntUser, ({ many }) => ({
  sessions: many(onPoyntSession),
  accounts: many(onPoyntAccount),
}));

export const onPoyntSessionRelations = relations(onPoyntSession, ({ one }) => ({
  user: one(onPoyntUser, {
    fields: [onPoyntSession.userId],
    references: [onPoyntUser.id],
  }),
}));

export const onPoyntAccountRelations = relations(onPoyntAccount, ({ one }) => ({
  user: one(onPoyntUser, {
    fields: [onPoyntAccount.userId],
    references: [onPoyntUser.id],
  }),
}));

// Type exports
export type OnPoyntUser = typeof onPoyntUser.$inferSelect;
export type NewOnPoyntUser = typeof onPoyntUser.$inferInsert;
export type OnPoyntSession = typeof onPoyntSession.$inferSelect;
export type NewOnPoyntSession = typeof onPoyntSession.$inferInsert;
export type OnPoyntAccount = typeof onPoyntAccount.$inferSelect;
export type NewOnPoyntAccount = typeof onPoyntAccount.$inferInsert;
