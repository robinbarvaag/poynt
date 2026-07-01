import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { plannerSchema } from "./_schema";
import { plannerUser } from "./auth";

/**
 * Medlemsfellesskap («On Poynt-fellesskapet») — en global, bedrift-uavhengig
 * meldingsflate som erstatter Facebook-medlemsgruppa. Alt knyttes til
 * `planner_user` direkte (IKKE workspace), nettopp fordi fellesskapet handler om
 * MEDLEMMENE på tvers av bedriftene deres.
 *
 * Alle tre formene (kanal/gruppe/DM) deler én `conversation`-modell, så
 * meldings-, vedlegg- og lesestatus-maskineriet er felles:
 * - `channel`: åpen for alle aktive medlemmer (ingen medlemskapsrad nødvendig),
 *   opprettes av Poynt-admins.
 * - `group`:   privat samtale med kuraterte medlemmer (medlemskapsrad kreves).
 * - `dm`:      1-til-1 (en gruppe med nøyaktig to medlemmer).
 */

export const plannerConversationTypeEnum = plannerSchema.enum(
  "planner_conversation_type",
  // `feed` = fellesskapets «vegg»: toppnivå-meldinger er innlegg, svar er
  // kommentarer. Deler alt meldings-maskineri med chatten.
  ["channel", "group", "dm", "feed"]
);

export const plannerConversationMemberRoleEnum = plannerSchema.enum(
  "planner_conversation_member_role",
  ["owner", "admin", "member"]
);

/**
 * Samtale — kanal, gruppe eller DM.
 */
export const plannerConversation = plannerSchema.table(
  "planner_conversation",
  {
    id: text("id").primaryKey(),
    type: plannerConversationTypeEnum("type").notNull().default("channel"),
    // Navn vises for kanaler/grupper. DM-er utleder navnet fra motparten.
    name: text("name"),
    // Lesbar slug for kanaler (#generelt). Null for grupper/DM.
    slug: text("slug").unique(),
    description: text("description"),
    // Ikonnavn (IconName) eller emoji — vises foran kanalnavnet.
    icon: text("icon"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdById: text("created_by_id").references(() => plannerUser.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("planner_conversation_type_idx").on(table.type),
    index("planner_conversation_slug_idx").on(table.slug),
  ]
);

/**
 * Samtale-medlem — for grupper og DM-er. Kanaler er åpne og trenger ingen rad.
 */
export const plannerConversationMember = plannerSchema.table(
  "planner_conversation_member",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => plannerConversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    role: plannerConversationMemberRoleEnum("role").notNull().default("member"),
    notificationsMuted: boolean("notifications_muted").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("planner_conversation_member_unique_idx").on(
      table.conversationId,
      table.userId
    ),
    index("planner_conversation_member_conversation_idx").on(
      table.conversationId
    ),
    index("planner_conversation_member_user_idx").on(table.userId),
  ]
);

/**
 * Lesestatus per (bruker, samtale) — driver uleste-teller for ALLE typer,
 * også åpne kanaler der brukeren ikke har en medlemskapsrad.
 */
export const plannerConversationRead = plannerSchema.table(
  "planner_conversation_read",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => plannerConversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("planner_conversation_read_unique_idx").on(
      table.conversationId,
      table.userId
    ),
    index("planner_conversation_read_user_idx").on(table.userId),
  ]
);

/**
 * Melding i en samtale. `body` kan være null når meldingen kun er vedlegg.
 * Soft-delete via `deletedAt` så tråden beholder rekkefølgen.
 */
export const plannerMessage = plannerSchema.table(
  "planner_message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => plannerConversation.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    // Selvreferanse: svar/sitat peker på meldingen det svarer på.
    parentMessageId: text("parent_message_id").references(
      (): AnyPgColumn => plannerMessage.id,
      { onDelete: "set null" }
    ),
    body: text("body"),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("planner_message_conversation_idx").on(
      table.conversationId,
      table.createdAt
    ),
    index("planner_message_author_idx").on(table.authorId),
  ]
);

/**
 * Vedlegg på en melding — lagres i Vercel Blob (samme lager som annen
 * On Poynt-opplasting), her holder vi bare metadata + offentlig URL.
 */
export const plannerMessageAttachment = plannerSchema.table(
  "planner_message_attachment",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => plannerMessage.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("planner_message_attachment_message_idx").on(table.messageId),
  ]
);

/**
 * Emoji-reaksjon på en melding. Én rad per (melding, bruker, emoji); unik så
 * samme bruker ikke kan reagere med samme emoji to ganger.
 */
export const plannerMessageReaction = plannerSchema.table(
  "planner_message_reaction",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => plannerMessage.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("planner_message_reaction_unique_idx").on(
      table.messageId,
      table.userId,
      table.emoji
    ),
    index("planner_message_reaction_message_idx").on(table.messageId),
  ]
);

/**
 * Web Push-abonnement (PushSubscription fra nettleseren). Brukes til å sende
 * push-varsler via VAPID — ingen ekstern tjeneste, levering går rett til
 * nettleserens egen push-tjeneste. Én rad per (endpoint).
 */
export const plannerPushSubscription = plannerSchema.table(
  "planner_push_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("planner_push_subscription_user_idx").on(table.userId)]
);

export const plannerNotificationTypeEnum = plannerSchema.enum(
  "planner_notification_type",
  ["mention", "dm", "comment"]
);

/**
 * Varsel i appen — driver bjella i toppbaren. Lages når noen nevner deg
 * (`mention`) eller sender deg en DM (`dm`). Bevisst polling-drevet (ingen
 * eksterne tjenester): klienten poller uleste-telleren som ellers.
 */
export const plannerNotification = plannerSchema.table(
  "planner_notification",
  {
    id: text("id").primaryKey(),
    // Mottakeren.
    userId: text("user_id")
      .notNull()
      .references(() => plannerUser.id, { onDelete: "cascade" }),
    type: plannerNotificationTypeEnum("type").notNull(),
    // Hvem utløste varselet.
    actorId: text("actor_id").references(() => plannerUser.id, {
      onDelete: "set null",
    }),
    conversationId: text("conversation_id").references(
      () => plannerConversation.id,
      { onDelete: "cascade" }
    ),
    messageId: text("message_id").references(() => plannerMessage.id, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("planner_notification_user_idx").on(table.userId, table.createdAt),
    index("planner_notification_user_read_idx").on(table.userId, table.readAt),
  ]
);

// Relations
export const plannerConversationRelations = relations(
  plannerConversation,
  ({ many, one }) => ({
    members: many(plannerConversationMember),
    messages: many(plannerMessage),
    reads: many(plannerConversationRead),
    createdBy: one(plannerUser, {
      fields: [plannerConversation.createdById],
      references: [plannerUser.id],
    }),
  })
);

export const plannerConversationMemberRelations = relations(
  plannerConversationMember,
  ({ one }) => ({
    conversation: one(plannerConversation, {
      fields: [plannerConversationMember.conversationId],
      references: [plannerConversation.id],
    }),
    user: one(plannerUser, {
      fields: [plannerConversationMember.userId],
      references: [plannerUser.id],
    }),
  })
);

export const plannerConversationReadRelations = relations(
  plannerConversationRead,
  ({ one }) => ({
    conversation: one(plannerConversation, {
      fields: [plannerConversationRead.conversationId],
      references: [plannerConversation.id],
    }),
    user: one(plannerUser, {
      fields: [plannerConversationRead.userId],
      references: [plannerUser.id],
    }),
  })
);

export const plannerMessageRelations = relations(
  plannerMessage,
  ({ one, many }) => ({
    conversation: one(plannerConversation, {
      fields: [plannerMessage.conversationId],
      references: [plannerConversation.id],
    }),
    author: one(plannerUser, {
      fields: [plannerMessage.authorId],
      references: [plannerUser.id],
    }),
    attachments: many(plannerMessageAttachment),
    reactions: many(plannerMessageReaction),
  })
);

export const plannerMessageReactionRelations = relations(
  plannerMessageReaction,
  ({ one }) => ({
    message: one(plannerMessage, {
      fields: [plannerMessageReaction.messageId],
      references: [plannerMessage.id],
    }),
    user: one(plannerUser, {
      fields: [plannerMessageReaction.userId],
      references: [plannerUser.id],
    }),
  })
);

export const plannerMessageAttachmentRelations = relations(
  plannerMessageAttachment,
  ({ one }) => ({
    message: one(plannerMessage, {
      fields: [plannerMessageAttachment.messageId],
      references: [plannerMessage.id],
    }),
  })
);

export const plannerNotificationRelations = relations(
  plannerNotification,
  ({ one }) => ({
    user: one(plannerUser, {
      fields: [plannerNotification.userId],
      references: [plannerUser.id],
    }),
    actor: one(plannerUser, {
      fields: [plannerNotification.actorId],
      references: [plannerUser.id],
    }),
    conversation: one(plannerConversation, {
      fields: [plannerNotification.conversationId],
      references: [plannerConversation.id],
    }),
    message: one(plannerMessage, {
      fields: [plannerNotification.messageId],
      references: [plannerMessage.id],
    }),
  })
);

// Type exports
export type PlannerConversation = typeof plannerConversation.$inferSelect;
export type NewPlannerConversation = typeof plannerConversation.$inferInsert;
export type PlannerConversationMember =
  typeof plannerConversationMember.$inferSelect;
export type NewPlannerConversationMember =
  typeof plannerConversationMember.$inferInsert;
export type PlannerConversationRead =
  typeof plannerConversationRead.$inferSelect;
export type NewPlannerConversationRead =
  typeof plannerConversationRead.$inferInsert;
export type PlannerMessage = typeof plannerMessage.$inferSelect;
export type NewPlannerMessage = typeof plannerMessage.$inferInsert;
export type PlannerMessageAttachment =
  typeof plannerMessageAttachment.$inferSelect;
export type NewPlannerMessageAttachment =
  typeof plannerMessageAttachment.$inferInsert;
export type PlannerNotification = typeof plannerNotification.$inferSelect;
export type NewPlannerNotification = typeof plannerNotification.$inferInsert;
export type PlannerMessageReaction = typeof plannerMessageReaction.$inferSelect;
export type NewPlannerMessageReaction =
  typeof plannerMessageReaction.$inferInsert;
export type PlannerPushSubscription =
  typeof plannerPushSubscription.$inferSelect;
export type NewPlannerPushSubscription =
  typeof plannerPushSubscription.$inferInsert;
