import { z } from "zod";

/**
 * Medlemsfellesskap — valideringsskjema delt mellom tRPC-router og klient.
 */

export const conversationTypes = ["channel", "group", "dm"] as const;
export type ConversationType = (typeof conversationTypes)[number];

export const conversationMemberRoles = ["owner", "admin", "member"] as const;
export type ConversationMemberRole = (typeof conversationMemberRoles)[number];

/**
 * Kanal-slug: små bokstaver, tall og bindestrek (à la #generelt, #spor-poynt).
 */
const channelSlug = z
  .string()
  .min(2, "Minst 2 tegn")
  .max(40, "Maks 40 tegn")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Bruk kun små bokstaver, tall og bindestrek"
  );

export const createChannelSchema = z.object({
  name: z.string().min(2, "Gi kanalen et navn").max(60, "Maks 60 tegn"),
  slug: channelSlug.optional(),
  description: z
    .string()
    .max(280, "Maks 280 tegn")
    .optional()
    .or(z.literal("")),
  icon: z.string().max(40).optional().or(z.literal("")),
});
export type CreateChannelInput = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(280).optional().or(z.literal("")),
  icon: z.string().max(40).optional().or(z.literal("")),
  isArchived: z.boolean().optional(),
});
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;

export const createGroupSchema = z.object({
  name: z.string().min(2, "Gi gruppa et navn").max(60, "Maks 60 tegn"),
  memberIds: z
    .array(z.string().min(1))
    .min(1, "Velg minst ett medlem")
    .max(50, "Maks 50 medlemmer"),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const createDmSchema = z.object({
  userId: z.string().min(1),
});
export type CreateDmInput = z.infer<typeof createDmSchema>;

/**
 * Vedlegg-metadata — URL-en kommer fra opplastingsruta, klienten sender bare
 * metadataen videre når meldingen lagres.
 */
export const messageAttachmentSchema = z.object({
  url: z.string().url(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type MessageAttachmentInput = z.infer<typeof messageAttachmentSchema>;

export const sendMessageSchema = z
  .object({
    conversationId: z.string().min(1),
    body: z.string().max(4000, "Maks 4000 tegn").optional(),
    attachments: z.array(messageAttachmentSchema).max(10).optional(),
    // Brukere som er nevnt med @ i meldingen — utløser varsler.
    mentionUserIds: z.array(z.string().min(1)).max(50).optional(),
    // Meldingen dette er et svar på (sitat).
    parentMessageId: z.string().optional(),
  })
  .refine(
    (v) =>
      (v.body && v.body.trim().length > 0) || (v.attachments?.length ?? 0) > 0,
    { message: "Skriv en melding eller legg ved en fil", path: ["body"] }
  );
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const markReadSchema = z.object({
  conversationId: z.string().min(1),
});
export type MarkReadInput = z.infer<typeof markReadSchema>;

export const listMembersSchema = z
  .object({
    search: z.string().max(80).optional(),
  })
  .optional();
export type ListMembersInput = z.infer<typeof listMembersSchema>;

export const notificationTypes = ["mention", "dm", "comment"] as const;
export type NotificationType = (typeof notificationTypes)[number];

/** Emoji-settet plukkeren tilbyr (holdt lite og bevisst). */
export const reactionEmojis = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "👀",
  "🙌",
  "🔥",
] as const;

export const toggleReactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(16),
});
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;

export const editMessageSchema = z.object({
  messageId: z.string().min(1),
  body: z.string().min(1, "Meldingen kan ikke være tom").max(4000),
});
export type EditMessageInput = z.infer<typeof editMessageSchema>;

export const deleteMessageSchema = z.object({
  messageId: z.string().min(1),
});
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;

export const addGroupMembersSchema = z.object({
  conversationId: z.string().min(1),
  memberIds: z.array(z.string().min(1)).min(1).max(50),
});
export type AddGroupMembersInput = z.infer<typeof addGroupMembersSchema>;

export const renameConversationSchema = z.object({
  conversationId: z.string().min(1),
  name: z.string().min(2, "Gi et navn").max(60, "Maks 60 tegn"),
});
export type RenameConversationInput = z.infer<typeof renameConversationSchema>;

export const savePushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});
export type SavePushSubscriptionInput = z.infer<
  typeof savePushSubscriptionSchema
>;

export const deletePushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
});
export type DeletePushSubscriptionInput = z.infer<
  typeof deletePushSubscriptionSchema
>;

export const listNotificationsSchema = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
  })
  .optional();
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

export const listMessagesSchema = z.object({
  conversationId: z.string().min(1),
  // Cursor = `createdAt` ISO-streng på eldste melding vi har; henter eldre enn den.
  before: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;

// Innlegg («veggen») — toppnivå-meldinger i feed-samtalen.
export const listPostsSchema = z
  .object({
    before: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .optional();
export type ListPostsInput = z.infer<typeof listPostsSchema>;

export const getCommentsSchema = z.object({
  postId: z.string().min(1),
});
export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
