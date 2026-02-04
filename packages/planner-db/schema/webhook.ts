import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Track processed Stripe webhook events to prevent duplicate processing.
 * Each event ID is stored after successful processing.
 */
export const plannerWebhookEvent = pgTable(
  "planner_webhook_event",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().unique(),
    type: text("type").notNull(),
    processedAt: timestamp("processed_at").defaultNow().notNull(),
  },
  (table) => [index("planner_webhook_event_event_id_idx").on(table.eventId)]
);

export type PlannerWebhookEvent = typeof plannerWebhookEvent.$inferSelect;
export type NewPlannerWebhookEvent = typeof plannerWebhookEvent.$inferInsert;
