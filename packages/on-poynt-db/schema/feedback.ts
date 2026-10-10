import { index, text, timestamp } from "drizzle-orm/pg-core";
import { onPoyntSchema } from "./_schema";
import { onPoyntUser } from "./auth";
import { onPoyntWorkspace } from "./workspace";

export type FeedbackCategory =
  | "challenge"
  | "feature"
  | "improvement"
  | "other";

export type FeedbackStatus =
  | "received"
  | "reviewing"
  | "planned"
  | "resolved"
  | "declined";

/**
 * Tilbakemelding / funksjonsønsker fra medlemmer. Privat: knyttet til
 * innsenderen (`userId`) og den aktive bedriften (`workspaceId`). Admin setter
 * `status` (+ valgfritt `adminResponse` som lukker loopen mot medlemmet).
 * Kategori/status er `text` med union-typer (ikke pg-enum) for å unngå enum-
 * migreringsfellene — samme mønster som `user.role`.
 */
export const onPoyntFeedback = onPoyntSchema.table(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").references(() => onPoyntWorkspace.id, {
      onDelete: "set null",
    }),
    category: text("category")
      .$type<FeedbackCategory>()
      .notNull()
      .default("other"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status")
      .$type<FeedbackStatus>()
      .notNull()
      .default("received"),
    /** Valgfritt svar fra admin, vist til medlemmet. */
    adminResponse: text("admin_response"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("feedback_user_idx").on(table.userId),
    index("feedback_status_idx").on(table.status),
    index("feedback_created_idx").on(table.createdAt),
  ]
);

export type OnPoyntFeedback = typeof onPoyntFeedback.$inferSelect;
export type NewOnPoyntFeedback = typeof onPoyntFeedback.$inferInsert;
