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
import { onPoyntSchema } from "./_schema";
import { onPoyntUser } from "./auth";

/**
 * Medlemsfellesskap («On Poynt-fellesskapet») — en global, bedrift-uavhengig
 * meldingsflate som erstatter Facebook-medlemsgruppa. Alt knyttes til
 * `user` direkte (IKKE workspace), nettopp fordi fellesskapet handler om
 * MEDLEMMENE på tvers av bedriftene deres.
 *
 * Alle tre formene (kanal/gruppe/DM) deler én `conversation`-modell, så
 * meldings-, vedlegg- og lesestatus-maskineriet er felles:
 * - `channel`: åpen for alle aktive medlemmer (ingen medlemskapsrad nødvendig),
 *   opprettes av Poynt-admins.
 * - `group`:   privat samtale med kuraterte medlemmer (medlemskapsrad kreves).
 * - `dm`:      1-til-1 (en gruppe med nøyaktig to medlemmer).
 */

export const onPoyntConversationTypeEnum = onPoyntSchema.enum(
  "conversation_type",
  // `feed` = fellesskapets «vegg»: toppnivå-meldinger er innlegg, svar er
  // kommentarer. Deler alt meldings-maskineri med chatten.
  ["channel", "group", "dm", "feed"]
);

export const onPoyntConversationMemberRoleEnum = onPoyntSchema.enum(
  "conversation_member_role",
  ["owner", "admin", "member"]
);

/**
 * Samtale — kanal, gruppe eller DM.
 */
export const onPoyntConversation = onPoyntSchema.table(
  "conversation",
  {
    id: text("id").primaryKey(),
    type: onPoyntConversationTypeEnum("type").notNull().default("channel"),
    // Navn vises for kanaler/grupper. DM-er utleder navnet fra motparten.
    name: text("name"),
    // Lesbar slug for kanaler (#generelt). Null for grupper/DM.
    slug: text("slug").unique(),
    description: text("description"),
    // Ikonnavn (IconName) eller emoji — vises foran kanalnavnet.
    icon: text("icon"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdById: text("created_by_id").references(() => onPoyntUser.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("conversation_type_idx").on(table.type),
    index("conversation_slug_idx").on(table.slug),
  ]
);

/**
 * Samtale-medlem — for grupper og DM-er. Kanaler er åpne og trenger ingen rad.
 */
export const onPoyntConversationMember = onPoyntSchema.table(
  "conversation_member",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => onPoyntConversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    role: onPoyntConversationMemberRoleEnum("role").notNull().default("member"),
    notificationsMuted: boolean("notifications_muted").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("conversation_member_unique_idx").on(
      table.conversationId,
      table.userId
    ),
    index("conversation_member_conversation_idx").on(table.conversationId),
    index("conversation_member_user_idx").on(table.userId),
  ]
);

/**
 * Lesestatus per (bruker, samtale) — driver uleste-teller for ALLE typer,
 * også åpne kanaler der brukeren ikke har en medlemskapsrad.
 */
export const onPoyntConversationRead = onPoyntSchema.table(
  "conversation_read",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => onPoyntConversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("conversation_read_unique_idx").on(
      table.conversationId,
      table.userId
    ),
    index("conversation_read_user_idx").on(table.userId),
  ]
);

/**
 * Melding i en samtale. `body` kan være null når meldingen kun er vedlegg.
 * Soft-delete via `deletedAt` så tråden beholder rekkefølgen.
 */
export const onPoyntMessage = onPoyntSchema.table(
  "message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => onPoyntConversation.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    // Selvreferanse: svar/sitat peker på meldingen det svarer på.
    parentMessageId: text("parent_message_id").references(
      (): AnyPgColumn => onPoyntMessage.id,
      { onDelete: "set null" }
    ),
    body: text("body"),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_conversation_idx").on(table.conversationId, table.createdAt),
    index("message_author_idx").on(table.authorId),
  ]
);

/**
 * Vedlegg på en melding — lagres i Vercel Blob (samme lager som annen
 * On Poynt-opplasting), her holder vi bare metadata + offentlig URL.
 */
export const onPoyntMessageAttachment = onPoyntSchema.table(
  "message_attachment",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => onPoyntMessage.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("message_attachment_message_idx").on(table.messageId)]
);

/**
 * Emoji-reaksjon på en melding. Én rad per (melding, bruker, emoji); unik så
 * samme bruker ikke kan reagere med samme emoji to ganger.
 */
export const onPoyntMessageReaction = onPoyntSchema.table(
  "message_reaction",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => onPoyntMessage.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("message_reaction_unique_idx").on(
      table.messageId,
      table.userId,
      table.emoji
    ),
    index("message_reaction_message_idx").on(table.messageId),
  ]
);

/**
 * Web Push-abonnement (PushSubscription fra nettleseren). Brukes til å sende
 * push-varsler via VAPID — ingen ekstern tjeneste, levering går rett til
 * nettleserens egen push-tjeneste. Én rad per (endpoint).
 */
export const onPoyntPushSubscription = onPoyntSchema.table(
  "push_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("push_subscription_user_idx").on(table.userId)]
);

export const onPoyntNotificationTypeEnum = onPoyntSchema.enum(
  "notification_type",
  ["mention", "dm", "comment"]
);

/**
 * Varsel i appen — driver bjella i toppbaren. Lages når noen nevner deg
 * (`mention`) eller sender deg en DM (`dm`). Bevisst polling-drevet (ingen
 * eksterne tjenester): klienten poller uleste-telleren som ellers.
 */
export const onPoyntNotification = onPoyntSchema.table(
  "notification",
  {
    id: text("id").primaryKey(),
    // Mottakeren.
    userId: text("user_id")
      .notNull()
      .references(() => onPoyntUser.id, { onDelete: "cascade" }),
    type: onPoyntNotificationTypeEnum("type").notNull(),
    // Hvem utløste varselet.
    actorId: text("actor_id").references(() => onPoyntUser.id, {
      onDelete: "set null",
    }),
    conversationId: text("conversation_id").references(
      () => onPoyntConversation.id,
      { onDelete: "cascade" }
    ),
    messageId: text("message_id").references(() => onPoyntMessage.id, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_idx").on(table.userId, table.createdAt),
    index("notification_user_read_idx").on(table.userId, table.readAt),
  ]
);

// Relations
export const onPoyntConversationRelations = relations(
  onPoyntConversation,
  ({ many, one }) => ({
    members: many(onPoyntConversationMember),
    messages: many(onPoyntMessage),
    reads: many(onPoyntConversationRead),
    createdBy: one(onPoyntUser, {
      fields: [onPoyntConversation.createdById],
      references: [onPoyntUser.id],
    }),
  })
);

export const onPoyntConversationMemberRelations = relations(
  onPoyntConversationMember,
  ({ one }) => ({
    conversation: one(onPoyntConversation, {
      fields: [onPoyntConversationMember.conversationId],
      references: [onPoyntConversation.id],
    }),
    user: one(onPoyntUser, {
      fields: [onPoyntConversationMember.userId],
      references: [onPoyntUser.id],
    }),
  })
);

export const onPoyntConversationReadRelations = relations(
  onPoyntConversationRead,
  ({ one }) => ({
    conversation: one(onPoyntConversation, {
      fields: [onPoyntConversationRead.conversationId],
      references: [onPoyntConversation.id],
    }),
    user: one(onPoyntUser, {
      fields: [onPoyntConversationRead.userId],
      references: [onPoyntUser.id],
    }),
  })
);

export const onPoyntMessageRelations = relations(
  onPoyntMessage,
  ({ one, many }) => ({
    conversation: one(onPoyntConversation, {
      fields: [onPoyntMessage.conversationId],
      references: [onPoyntConversation.id],
    }),
    author: one(onPoyntUser, {
      fields: [onPoyntMessage.authorId],
      references: [onPoyntUser.id],
    }),
    attachments: many(onPoyntMessageAttachment),
    reactions: many(onPoyntMessageReaction),
  })
);

export const onPoyntMessageReactionRelations = relations(
  onPoyntMessageReaction,
  ({ one }) => ({
    message: one(onPoyntMessage, {
      fields: [onPoyntMessageReaction.messageId],
      references: [onPoyntMessage.id],
    }),
    user: one(onPoyntUser, {
      fields: [onPoyntMessageReaction.userId],
      references: [onPoyntUser.id],
    }),
  })
);

export const onPoyntMessageAttachmentRelations = relations(
  onPoyntMessageAttachment,
  ({ one }) => ({
    message: one(onPoyntMessage, {
      fields: [onPoyntMessageAttachment.messageId],
      references: [onPoyntMessage.id],
    }),
  })
);

export const onPoyntNotificationRelations = relations(
  onPoyntNotification,
  ({ one }) => ({
    user: one(onPoyntUser, {
      fields: [onPoyntNotification.userId],
      references: [onPoyntUser.id],
    }),
    actor: one(onPoyntUser, {
      fields: [onPoyntNotification.actorId],
      references: [onPoyntUser.id],
    }),
    conversation: one(onPoyntConversation, {
      fields: [onPoyntNotification.conversationId],
      references: [onPoyntConversation.id],
    }),
    message: one(onPoyntMessage, {
      fields: [onPoyntNotification.messageId],
      references: [onPoyntMessage.id],
    }),
  })
);

// Type exports
export type OnPoyntConversation = typeof onPoyntConversation.$inferSelect;
export type NewOnPoyntConversation = typeof onPoyntConversation.$inferInsert;
export type OnPoyntConversationMember =
  typeof onPoyntConversationMember.$inferSelect;
export type NewOnPoyntConversationMember =
  typeof onPoyntConversationMember.$inferInsert;
export type OnPoyntConversationRead =
  typeof onPoyntConversationRead.$inferSelect;
export type NewOnPoyntConversationRead =
  typeof onPoyntConversationRead.$inferInsert;
export type OnPoyntMessage = typeof onPoyntMessage.$inferSelect;
export type NewOnPoyntMessage = typeof onPoyntMessage.$inferInsert;
export type OnPoyntMessageAttachment =
  typeof onPoyntMessageAttachment.$inferSelect;
export type NewOnPoyntMessageAttachment =
  typeof onPoyntMessageAttachment.$inferInsert;
export type OnPoyntNotification = typeof onPoyntNotification.$inferSelect;
export type NewOnPoyntNotification = typeof onPoyntNotification.$inferInsert;
export type OnPoyntMessageReaction = typeof onPoyntMessageReaction.$inferSelect;
export type NewOnPoyntMessageReaction =
  typeof onPoyntMessageReaction.$inferInsert;
export type OnPoyntPushSubscription =
  typeof onPoyntPushSubscription.$inferSelect;
export type NewOnPoyntPushSubscription =
  typeof onPoyntPushSubscription.$inferInsert;
