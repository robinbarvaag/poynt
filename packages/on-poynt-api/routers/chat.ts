import { db } from "@poynt/on-poynt-db";
import {
  onPoyntConversation,
  onPoyntConversationMember,
  onPoyntConversationRead,
  onPoyntMessage,
  onPoyntMessageAttachment,
  onPoyntMessageReaction,
  onPoyntNotification,
  onPoyntPushSubscription,
  onPoyntUser,
} from "@poynt/on-poynt-db/schema";
import {
  addGroupMembersSchema,
  createChannelSchema,
  createDmSchema,
  createGroupSchema,
  deleteMessageSchema,
  deletePushSubscriptionSchema,
  editMessageSchema,
  getCommentsSchema,
  listMembersSchema,
  listMessagesSchema,
  listNotificationsSchema,
  listPostsSchema,
  markReadSchema,
  renameConversationSchema,
  savePushSubscriptionSchema,
  sendMessageSchema,
  toggleReactionSchema,
  updateChannelSchema,
} from "@poynt/on-poynt-validators";
import { generateSlug } from "@poynt/utils/generate-slug";
import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  ne,
  sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendPushToUser } from "../lib/web-push";
import { adminProcedure, memberProcedure, router } from "../trpc";

type ConversationRow = typeof onPoyntConversation.$inferSelect;

/**
 * Trimmet bruker-form vi sender til klienten (aldri hele rad-en).
 */
function publicUser(u: {
  id: string;
  name: string;
  image: string | null;
}) {
  return { id: u.id, name: u.name, image: u.image };
}

type ReactionSummary = { emoji: string; count: number; mine: boolean };

/**
 * Slå sammen rå reaksjonsrader til { emoji, antall, reagerte-jeg } per emoji.
 */
function aggregateReactions(
  reactions: { emoji: string; userId: string }[],
  userId: string
): ReactionSummary[] {
  const map = new Map<string, ReactionSummary>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    entry.count += 1;
    if (r.userId === userId) entry.mine = true;
    map.set(r.emoji, entry);
  }
  return Array.from(map.values());
}

type MessageWithRelations = typeof onPoyntMessage.$inferSelect & {
  author: { id: string; name: string; image: string | null };
  attachments: (typeof onPoyntMessageAttachment.$inferSelect)[];
  reactions: { emoji: string; userId: string }[];
};

/** Felles klient-form for en melding/innlegg/kommentar. */
function mapMessage(m: MessageWithRelations, userId: string) {
  return {
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    author: publicUser(m.author),
    attachments: m.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
    })),
    reactions: aggregateReactions(m.reactions, userId),
  };
}

/**
 * Fellesskapets «vegg» — én global feed-samtale. Opprettes ved første bruk
 * (slug-unik, så parallelle kall kolliderer trygt).
 */
async function ensureFeedConversation() {
  const existing = await db.query.onPoyntConversation.findFirst({
    where: eq(onPoyntConversation.type, "feed"),
  });
  if (existing) return existing;

  await db
    .insert(onPoyntConversation)
    .values({
      id: nanoid(),
      type: "feed",
      name: "Innlegg",
      slug: "innlegg",
      description: "Fellesskapets vegg — del, spør og feir.",
    })
    .onConflictDoNothing({ target: onPoyntConversation.slug });

  const created = await db.query.onPoyntConversation.findFirst({
    where: eq(onPoyntConversation.type, "feed"),
  });
  if (!created) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Kunne ikke opprette veggen",
    });
  }
  return created;
}

/**
 * Sjekk at brukeren har tilgang til samtalen og returner samtalen.
 * - Kanaler: åpne for alle innloggede medlemmer (app-laget krever aktivt
 *   medlemskap), men ikke arkiverte.
 * - Grupper/DM: krever en medlemskapsrad.
 */
async function getAccessibleConversation(
  userId: string,
  conversationId: string
): Promise<ConversationRow> {
  const conversation = await db.query.onPoyntConversation.findFirst({
    where: eq(onPoyntConversation.id, conversationId),
  });

  if (!conversation) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Samtalen finnes ikke" });
  }

  // Kanaler og feeden («veggen») er åpne for alle aktive medlemmer.
  if (conversation.type === "channel" || conversation.type === "feed") {
    if (conversation.isArchived) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Kanalen er arkivert",
      });
    }
    return conversation;
  }

  const member = await db.query.onPoyntConversationMember.findFirst({
    where: and(
      eq(onPoyntConversationMember.conversationId, conversationId),
      eq(onPoyntConversationMember.userId, userId)
    ),
  });
  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Du har ikke tilgang til denne samtalen",
    });
  }
  return conversation;
}

/**
 * Sett sammen liste-oppføringen for én samtale: visningsnavn, siste melding og
 * antall uleste for `userId`.
 */
async function summarizeConversation(
  userId: string,
  conversation: ConversationRow
) {
  // Visningsnavn — for DM utleder vi navnet fra motparten.
  let displayName = conversation.name ?? "Samtale";
  let displayImage: string | null = null;

  if (conversation.type === "dm") {
    const other = await db
      .select({
        id: onPoyntUser.id,
        name: onPoyntUser.name,
        image: onPoyntUser.image,
      })
      .from(onPoyntConversationMember)
      .innerJoin(
        onPoyntUser,
        eq(onPoyntConversationMember.userId, onPoyntUser.id)
      )
      .where(
        and(
          eq(onPoyntConversationMember.conversationId, conversation.id),
          ne(onPoyntConversationMember.userId, userId)
        )
      )
      .limit(1);
    if (other[0]) {
      displayName = other[0].name;
      displayImage = other[0].image;
    }
  }

  // Siste melding (ikke slettet).
  const [last] = await db
    .select({
      body: onPoyntMessage.body,
      createdAt: onPoyntMessage.createdAt,
      authorName: onPoyntUser.name,
    })
    .from(onPoyntMessage)
    .innerJoin(onPoyntUser, eq(onPoyntMessage.authorId, onPoyntUser.id))
    .where(
      and(
        eq(onPoyntMessage.conversationId, conversation.id),
        isNull(onPoyntMessage.deletedAt)
      )
    )
    .orderBy(desc(onPoyntMessage.createdAt))
    .limit(1);

  const unread = await unreadFor(userId, conversation.id);

  return {
    id: conversation.id,
    type: conversation.type,
    name: displayName,
    slug: conversation.slug,
    icon: conversation.icon,
    image: displayImage,
    description: conversation.description,
    lastMessage: last
      ? {
          body: last.body,
          authorName: last.authorName,
          createdAt: last.createdAt,
        }
      : null,
    lastMessageAt: last?.createdAt ?? conversation.createdAt,
    unread,
  };
}

/**
 * Antall uleste meldinger for `userId` i én samtale: meldinger nyere enn
 * lesestatus (lastReadAt), ikke fra meg selv, ikke slettet.
 */
async function unreadFor(
  userId: string,
  conversationId: string
): Promise<number> {
  const read = await db.query.onPoyntConversationRead.findFirst({
    where: and(
      eq(onPoyntConversationRead.conversationId, conversationId),
      eq(onPoyntConversationRead.userId, userId)
    ),
  });

  const conditions = [
    eq(onPoyntMessage.conversationId, conversationId),
    isNull(onPoyntMessage.deletedAt),
    ne(onPoyntMessage.authorId, userId),
  ];
  if (read?.lastReadAt) {
    conditions.push(gt(onPoyntMessage.createdAt, read.lastReadAt));
  }
  const [row] = await db
    .select({ unread: sql<number>`cast(count(*) as int)` })
    .from(onPoyntMessage)
    .where(and(...conditions));

  return Number(row?.unread) || 0;
}

export const chatRouter = router({
  /**
   * Alle samtaler brukeren ser: åpne kanaler + grupper/DM hen er medlem av.
   * Sortert med nyeste aktivitet øverst.
   */
  listConversations: memberProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const channels = await db.query.onPoyntConversation.findMany({
      where: and(
        eq(onPoyntConversation.type, "channel"),
        eq(onPoyntConversation.isArchived, false)
      ),
    });

    const memberships = await db.query.onPoyntConversationMember.findMany({
      where: eq(onPoyntConversationMember.userId, userId),
      with: { conversation: true },
    });
    const privateConvos = memberships
      .map((m) => m.conversation)
      .filter((c) => c.type !== "channel" && !c.isArchived);

    const all = [...channels, ...privateConvos];
    const summaries = await Promise.all(
      all.map((c) => summarizeConversation(userId, c))
    );

    summaries.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );

    return summaries;
  }),

  /**
   * Metadata om én samtale (header). Tilgangssjekket.
   */
  getConversation: memberProcedure
    .input(markReadSchema)
    .query(async ({ ctx, input }) => {
      const conversation = await getAccessibleConversation(
        ctx.userId,
        input.conversationId
      );
      return summarizeConversation(ctx.userId, conversation);
    }),

  /**
   * Meldinger i en samtale (nyeste 50, eldre via `before`-cursor). Returneres
   * stigende (eldst → nyest) for visning.
   */
  getMessages: memberProcedure
    .input(listMessagesSchema)
    .query(async ({ ctx, input }) => {
      await getAccessibleConversation(ctx.userId, input.conversationId);

      const limit = input.limit ?? 50;
      const where = [
        eq(onPoyntMessage.conversationId, input.conversationId),
        isNull(onPoyntMessage.deletedAt),
      ];
      if (input.before) {
        where.push(lt(onPoyntMessage.createdAt, new Date(input.before)));
      }

      const rows = await db.query.onPoyntMessage.findMany({
        where: and(...where),
        with: { author: true, attachments: true, reactions: true },
        orderBy: desc(onPoyntMessage.createdAt),
        limit,
      });

      const hasMore = rows.length === limit;
      const nextCursor = hasMore
        ? rows[rows.length - 1]?.createdAt.toISOString()
        : null;

      // Hent «svarer på»-foreldre i én batch og bygg en preview-oppslag.
      const parentIds = rows
        .map((m) => m.parentMessageId)
        .filter((id): id is string => Boolean(id));
      const parents = parentIds.length
        ? await db.query.onPoyntMessage.findMany({
            where: inArray(onPoyntMessage.id, parentIds),
            with: { author: true },
          })
        : [];
      const parentMap = new Map(
        parents.map((p) => [
          p.id,
          {
            id: p.id,
            authorName: p.author.name,
            body: p.deletedAt ? null : p.body,
          },
        ])
      );

      // Snu til stigende for visning.
      const messages = rows.reverse().map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        editedAt: m.editedAt,
        author: publicUser(m.author),
        replyTo: m.parentMessageId
          ? (parentMap.get(m.parentMessageId) ?? null)
          : null,
        attachments: m.attachments.map((a) => ({
          id: a.id,
          url: a.url,
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          width: a.width,
          height: a.height,
        })),
        reactions: aggregateReactions(m.reactions, ctx.userId),
      }));

      return { messages, nextCursor };
    }),

  /**
   * Send en melding (med valgfrie vedlegg). Markerer samtalen som lest for
   * avsenderen.
   */
  sendMessage: memberProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const conversation = await getAccessibleConversation(
        userId,
        input.conversationId
      );

      const messageId = nanoid();
      const body = input.body?.trim() || null;

      // Valider at «svarer på» tilhører samme samtale (ellers ignorer).
      let parentMessageId: string | null = null;
      if (input.parentMessageId) {
        const parent = await db.query.onPoyntMessage.findFirst({
          where: eq(onPoyntMessage.id, input.parentMessageId),
          columns: { id: true, conversationId: true },
        });
        if (parent?.conversationId === input.conversationId) {
          parentMessageId = parent.id;
        }
      }

      await db.insert(onPoyntMessage).values({
        id: messageId,
        conversationId: input.conversationId,
        authorId: userId,
        parentMessageId,
        body,
      });

      if (input.attachments?.length) {
        await db.insert(onPoyntMessageAttachment).values(
          input.attachments.map((a) => ({
            id: nanoid(),
            messageId,
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            width: a.width ?? null,
            height: a.height ?? null,
          }))
        );
      }

      // Avsenderen har «lest» sin egen melding.
      await markConversationRead(userId, input.conversationId);

      // Varsler: omtaler (alle typer), DM til motparten, kommentar til
      // innleggs-forfatteren.
      await createMessageNotifications({
        authorId: userId,
        conversation,
        messageId,
        mentionUserIds: input.mentionUserIds ?? [],
        parentMessageId,
      });

      const created = await db.query.onPoyntMessage.findFirst({
        where: eq(onPoyntMessage.id, messageId),
        with: { author: true, attachments: true },
      });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke lagre meldingen",
        });
      }

      return {
        id: created.id,
        body: created.body,
        createdAt: created.createdAt,
        editedAt: created.editedAt,
        author: publicUser(created.author),
        replyTo: null as {
          id: string;
          authorName: string;
          body: string | null;
        } | null,
        attachments: created.attachments.map((a) => ({
          id: a.id,
          url: a.url,
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          width: a.width,
          height: a.height,
        })),
        reactions: [] as ReactionSummary[],
      };
    }),

  /**
   * Rediger egen melding.
   */
  editMessage: memberProcedure
    .input(editMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const message = await db.query.onPoyntMessage.findFirst({
        where: eq(onPoyntMessage.id, input.messageId),
        columns: { id: true, authorId: true, conversationId: true },
      });
      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meldingen finnes ikke",
        });
      }
      if (message.authorId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Du kan bare redigere dine egne meldinger",
        });
      }
      await db
        .update(onPoyntMessage)
        .set({ body: input.body.trim(), editedAt: new Date() })
        .where(eq(onPoyntMessage.id, input.messageId));
      return { success: true };
    }),

  /**
   * Slett egen melding (soft-delete — forsvinner fra tråden).
   */
  deleteMessage: memberProcedure
    .input(deleteMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const message = await db.query.onPoyntMessage.findFirst({
        where: eq(onPoyntMessage.id, input.messageId),
        columns: { id: true, authorId: true },
      });
      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meldingen finnes ikke",
        });
      }
      if (message.authorId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Du kan bare slette dine egne meldinger",
        });
      }
      await db
        .update(onPoyntMessage)
        .set({ deletedAt: new Date() })
        .where(eq(onPoyntMessage.id, input.messageId));
      return { success: true };
    }),

  /**
   * Slå en emoji-reaksjon på/av for en melding.
   */
  toggleReaction: memberProcedure
    .input(toggleReactionSchema)
    .mutation(async ({ ctx, input }) => {
      const message = await db.query.onPoyntMessage.findFirst({
        where: eq(onPoyntMessage.id, input.messageId),
        columns: { id: true, conversationId: true },
      });
      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meldingen finnes ikke",
        });
      }
      await getAccessibleConversation(ctx.userId, message.conversationId);

      const existing = await db.query.onPoyntMessageReaction.findFirst({
        where: and(
          eq(onPoyntMessageReaction.messageId, input.messageId),
          eq(onPoyntMessageReaction.userId, ctx.userId),
          eq(onPoyntMessageReaction.emoji, input.emoji)
        ),
      });

      if (existing) {
        await db
          .delete(onPoyntMessageReaction)
          .where(eq(onPoyntMessageReaction.id, existing.id));
        return { reacted: false };
      }

      await db.insert(onPoyntMessageReaction).values({
        id: nanoid(),
        messageId: input.messageId,
        userId: ctx.userId,
        emoji: input.emoji,
      });
      return { reacted: true };
    }),

  /**
   * Marker en samtale som lest (nullstiller uleste-telleren).
   */
  markRead: memberProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      await getAccessibleConversation(ctx.userId, input.conversationId);
      await markConversationRead(ctx.userId, input.conversationId);
      return { success: true };
    }),

  /**
   * Opprett en kanal (kun Poynt-admins).
   */
  createChannel: adminProcedure
    .input(createChannelSchema)
    .mutation(async ({ ctx, input }) => {
      let slug =
        input.slug?.trim() || generateSlug(input.name, { maxLength: 40 });

      const exists = await db.query.onPoyntConversation.findFirst({
        where: eq(onPoyntConversation.slug, slug),
      });
      if (exists) {
        slug = `${slug}-${nanoid(4)}`;
      }

      const [channel] = await db
        .insert(onPoyntConversation)
        .values({
          id: nanoid(),
          type: "channel",
          name: input.name,
          slug,
          description: input.description || null,
          icon: input.icon || null,
          createdById: ctx.userId,
        })
        .returning();

      return channel;
    }),

  /**
   * Oppdater / arkiver en kanal (kun admins).
   */
  updateChannel: adminProcedure
    .input(updateChannelSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(onPoyntConversation)
        .set({
          name: input.name,
          description:
            input.description === undefined
              ? undefined
              : input.description || null,
          icon: input.icon === undefined ? undefined : input.icon || null,
          isArchived: input.isArchived,
        })
        .where(eq(onPoyntConversation.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kanalen finnes ikke",
        });
      }
      return updated;
    }),

  /**
   * Opprett en gruppechat med valgte medlemmer (avsender blir eier).
   */
  createGroup: memberProcedure
    .input(createGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const conversationId = nanoid();

      await db.insert(onPoyntConversation).values({
        id: conversationId,
        type: "group",
        name: input.name,
        createdById: userId,
      });

      const memberIds = Array.from(new Set([userId, ...input.memberIds]));
      await db.insert(onPoyntConversationMember).values(
        memberIds.map((id) => ({
          id: nanoid(),
          conversationId,
          userId: id,
          role: id === userId ? ("owner" as const) : ("member" as const),
        }))
      );

      return { id: conversationId };
    }),

  /**
   * Åpne (eller gjenbruk) en 1-til-1-DM med et annet medlem.
   */
  createDm: memberProcedure
    .input(createDmSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      if (input.userId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Du kan ikke starte en DM med deg selv",
        });
      }

      // Finnes det allerede en DM mellom de to? (samtale av type dm der begge
      // er medlemmer)
      const mine = await db.query.onPoyntConversationMember.findMany({
        where: eq(onPoyntConversationMember.userId, userId),
        with: { conversation: true },
      });
      const dmIds = mine
        .filter((m) => m.conversation.type === "dm")
        .map((m) => m.conversationId);
      if (dmIds.length) {
        const shared = await db.query.onPoyntConversationMember.findFirst({
          where: and(
            inArray(onPoyntConversationMember.conversationId, dmIds),
            eq(onPoyntConversationMember.userId, input.userId)
          ),
        });
        if (shared) return { id: shared.conversationId };
      }

      const conversationId = nanoid();
      await db.insert(onPoyntConversation).values({
        id: conversationId,
        type: "dm",
        createdById: userId,
      });
      await db.insert(onPoyntConversationMember).values([
        { id: nanoid(), conversationId, userId, role: "owner" },
        { id: nanoid(), conversationId, userId: input.userId, role: "member" },
      ]);

      return { id: conversationId };
    }),

  /**
   * Medlemmene i en gruppe/DM (for «vis medlemmer»). Tilgangssjekket.
   */
  getConversationMembers: memberProcedure
    .input(markReadSchema)
    .query(async ({ ctx, input }) => {
      await getAccessibleConversation(ctx.userId, input.conversationId);

      const members = await db.query.onPoyntConversationMember.findMany({
        where: eq(
          onPoyntConversationMember.conversationId,
          input.conversationId
        ),
        with: { user: true },
      });

      return members.map((m) => ({
        role: m.role,
        user: publicUser(m.user),
      }));
    }),

  /**
   * Legg til medlemmer i en gruppe (kun medlemmer av gruppa).
   */
  addGroupMembers: memberProcedure
    .input(addGroupMembersSchema)
    .mutation(async ({ ctx, input }) => {
      const conversation = await getAccessibleConversation(
        ctx.userId,
        input.conversationId
      );
      if (conversation.type !== "group") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan bare legge til medlemmer i en gruppe",
        });
      }

      const existing = await db.query.onPoyntConversationMember.findMany({
        where: eq(
          onPoyntConversationMember.conversationId,
          input.conversationId
        ),
        columns: { userId: true },
      });
      const have = new Set(existing.map((m) => m.userId));
      const toAdd = Array.from(new Set(input.memberIds)).filter(
        (id) => !have.has(id)
      );
      if (toAdd.length === 0) return { added: 0 };

      await db.insert(onPoyntConversationMember).values(
        toAdd.map((id) => ({
          id: nanoid(),
          conversationId: input.conversationId,
          userId: id,
          role: "member" as const,
        }))
      );
      return { added: toAdd.length };
    }),

  /**
   * Forlat en gruppe (DM-er kan ikke forlates).
   */
  leaveConversation: memberProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      const conversation = await getAccessibleConversation(
        ctx.userId,
        input.conversationId
      );
      if (conversation.type !== "group") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Du kan bare forlate grupper",
        });
      }
      await db
        .delete(onPoyntConversationMember)
        .where(
          and(
            eq(onPoyntConversationMember.conversationId, input.conversationId),
            eq(onPoyntConversationMember.userId, ctx.userId)
          )
        );
      return { success: true };
    }),

  /**
   * Gi en gruppe nytt navn (kun medlemmer).
   */
  renameConversation: memberProcedure
    .input(renameConversationSchema)
    .mutation(async ({ ctx, input }) => {
      const conversation = await getAccessibleConversation(
        ctx.userId,
        input.conversationId
      );
      if (conversation.type !== "group") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan bare gi nytt navn til grupper",
        });
      }
      await db
        .update(onPoyntConversation)
        .set({ name: input.name })
        .where(eq(onPoyntConversation.id, input.conversationId));
      return { success: true };
    }),

  /**
   * Medlemskatalog — andre medlemmer man kan starte en DM eller gruppe med.
   * Valgfritt fritekst-søk på navn/e-post.
   */
  listMembers: memberProcedure
    .input(listMembersSchema)
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim();
      const conditions = [ne(onPoyntUser.id, ctx.userId)];
      if (search) {
        conditions.push(
          sql`(${ilike(onPoyntUser.name, `%${search}%`)} or ${ilike(
            onPoyntUser.email,
            `%${search}%`
          )})`
        );
      }

      const members = await db
        .select({
          id: onPoyntUser.id,
          name: onPoyntUser.name,
          image: onPoyntUser.image,
        })
        .from(onPoyntUser)
        .where(and(...conditions))
        .orderBy(asc(onPoyntUser.name))
        .limit(100);

      return members;
    }),

  /**
   * Totalt antall uleste meldinger på tvers av alle samtaler brukeren ser —
   * driver uleste-merket i menyen.
   */
  unreadCount: memberProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const channels = await db.query.onPoyntConversation.findMany({
      where: and(
        eq(onPoyntConversation.type, "channel"),
        eq(onPoyntConversation.isArchived, false)
      ),
      columns: { id: true },
    });

    const memberships = await db.query.onPoyntConversationMember.findMany({
      where: eq(onPoyntConversationMember.userId, userId),
      with: { conversation: { columns: { id: true, isArchived: true } } },
    });
    const privateIds = memberships
      .filter((m) => !m.conversation.isArchived)
      .map((m) => m.conversationId);

    const ids = [...channels.map((c) => c.id), ...privateIds];
    const counts = await Promise.all(ids.map((id) => unreadFor(userId, id)));
    const total = counts.reduce((sum, n) => sum + n, 0);

    return { total };
  }),

  /**
   * Varsler for bjella — nyeste omtaler/DM-er med avsender + samtale.
   */
  listNotifications: memberProcedure
    .input(listNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const rows = await db.query.onPoyntNotification.findMany({
        where: eq(onPoyntNotification.userId, ctx.userId),
        with: { actor: true, conversation: true },
        orderBy: desc(onPoyntNotification.createdAt),
        limit: input?.limit ?? 20,
      });

      return rows.map((n) => ({
        id: n.id,
        type: n.type,
        conversationId: n.conversationId,
        readAt: n.readAt,
        createdAt: n.createdAt,
        actor: n.actor ? publicUser(n.actor) : null,
        conversation: n.conversation
          ? {
              id: n.conversation.id,
              type: n.conversation.type,
              name: n.conversation.name,
            }
          : null,
      }));
    }),

  /**
   * Antall uleste varsler — driver tallet på bjella.
   */
  unreadNotificationCount: memberProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(onPoyntNotification)
      .where(
        and(
          eq(onPoyntNotification.userId, ctx.userId),
          isNull(onPoyntNotification.readAt)
        )
      );
    return { total: Number(row?.total) || 0 };
  }),

  /**
   * Marker alle varsler som lest.
   */
  markNotificationsRead: memberProcedure.mutation(async ({ ctx }) => {
    await db
      .update(onPoyntNotification)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(onPoyntNotification.userId, ctx.userId),
          isNull(onPoyntNotification.readAt)
        )
      );
    return { success: true };
  }),

  /**
   * Lettvekts «versjon» av en samtale for smart polling: klienten poller denne
   * (billig) og henter meldinger på nytt KUN når versjonen endrer seg.
   * Fanger nye/redigerte/slettede meldinger og reaksjoner (antall).
   */
  getActivity: memberProcedure
    .input(markReadSchema)
    .query(async ({ ctx, input }) => {
      await getAccessibleConversation(ctx.userId, input.conversationId);

      const [msg] = await db
        .select({
          ts: sql<
            string | null
          >`greatest(max(${onPoyntMessage.createdAt}), max(${onPoyntMessage.editedAt}), max(${onPoyntMessage.deletedAt}))`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(onPoyntMessage)
        .where(eq(onPoyntMessage.conversationId, input.conversationId));

      const [react] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(onPoyntMessageReaction)
        .innerJoin(
          onPoyntMessage,
          eq(onPoyntMessageReaction.messageId, onPoyntMessage.id)
        )
        .where(eq(onPoyntMessage.conversationId, input.conversationId));

      return {
        version: `${msg?.ts ?? ""}:${msg?.count ?? 0}:${react?.count ?? 0}`,
      };
    }),

  /**
   * Fellesskapets «vegg» (feed-samtalen) — opprettes ved første kall.
   */
  getFeed: memberProcedure.query(async () => {
    const feed = await ensureFeedConversation();
    return {
      id: feed.id,
      name: feed.name,
      description: feed.description,
    };
  }),

  /**
   * Innlegg på veggen: toppnivå-meldinger (nyeste først) med kommentar-antall.
   */
  listPosts: memberProcedure
    .input(listPostsSchema)
    .query(async ({ ctx, input }) => {
      const feed = await ensureFeedConversation();
      const limit = input?.limit ?? 20;

      const where = [
        eq(onPoyntMessage.conversationId, feed.id),
        isNull(onPoyntMessage.parentMessageId),
        isNull(onPoyntMessage.deletedAt),
      ];
      if (input?.before) {
        where.push(lt(onPoyntMessage.createdAt, new Date(input.before)));
      }

      const rows = await db.query.onPoyntMessage.findMany({
        where: and(...where),
        with: { author: true, attachments: true, reactions: true },
        orderBy: desc(onPoyntMessage.createdAt),
        limit,
      });

      // Kommentar-antall i én batch.
      const postIds = rows.map((r) => r.id);
      const counts = postIds.length
        ? await db
            .select({
              parentId: onPoyntMessage.parentMessageId,
              count: sql<number>`cast(count(*) as int)`,
            })
            .from(onPoyntMessage)
            .where(
              and(
                inArray(onPoyntMessage.parentMessageId, postIds),
                isNull(onPoyntMessage.deletedAt)
              )
            )
            .groupBy(onPoyntMessage.parentMessageId)
        : [];
      const countMap = new Map(
        counts.map((c) => [c.parentId, Number(c.count) || 0])
      );

      const hasMore = rows.length === limit;
      return {
        feedId: feed.id,
        posts: rows.map((m) => ({
          ...mapMessage(m, ctx.userId),
          commentCount: countMap.get(m.id) ?? 0,
        })),
        nextCursor: hasMore
          ? (rows[rows.length - 1]?.createdAt.toISOString() ?? null)
          : null,
      };
    }),

  /**
   * Kommentarene til et innlegg (eldste først).
   */
  getComments: memberProcedure
    .input(getCommentsSchema)
    .query(async ({ ctx, input }) => {
      const post = await db.query.onPoyntMessage.findFirst({
        where: eq(onPoyntMessage.id, input.postId),
        columns: { id: true, conversationId: true },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Innlegget finnes ikke",
        });
      }
      await getAccessibleConversation(ctx.userId, post.conversationId);

      const rows = await db.query.onPoyntMessage.findMany({
        where: and(
          eq(onPoyntMessage.parentMessageId, input.postId),
          isNull(onPoyntMessage.deletedAt)
        ),
        with: { author: true, attachments: true, reactions: true },
        orderBy: asc(onPoyntMessage.createdAt),
        limit: 200,
      });

      return rows.map((m) => mapMessage(m, ctx.userId));
    }),

  /**
   * Lagre (eller oppdatere) et Web Push-abonnement for denne brukeren.
   */
  savePushSubscription: memberProcedure
    .input(savePushSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.onPoyntPushSubscription.findFirst({
        where: eq(onPoyntPushSubscription.endpoint, input.endpoint),
      });
      if (existing) {
        await db
          .update(onPoyntPushSubscription)
          .set({
            userId: ctx.userId,
            p256dh: input.p256dh,
            auth: input.auth,
          })
          .where(eq(onPoyntPushSubscription.endpoint, input.endpoint));
      } else {
        await db.insert(onPoyntPushSubscription).values({
          id: nanoid(),
          userId: ctx.userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        });
      }
      return { success: true };
    }),

  /**
   * Fjern et Web Push-abonnement (når brukeren skrur av push på enheten).
   */
  deletePushSubscription: memberProcedure
    .input(deletePushSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(onPoyntPushSubscription)
        .where(
          and(
            eq(onPoyntPushSubscription.endpoint, input.endpoint),
            eq(onPoyntPushSubscription.userId, ctx.userId)
          )
        );
      return { success: true };
    }),
});

/**
 * Lag varsler for en ny melding: omtaler (alle samtaletyper) + DM-varsel til
 * motparten. For grupper/DM filtreres omtaler til faktiske medlemmer.
 */
async function createMessageNotifications({
  authorId,
  conversation,
  messageId,
  mentionUserIds,
  parentMessageId,
}: {
  authorId: string;
  conversation: ConversationRow;
  messageId: string;
  mentionUserIds: string[];
  parentMessageId?: string | null;
}) {
  // type per mottaker — «mention» vinner over «dm»/«comment».
  const recipients = new Map<string, "mention" | "dm" | "comment">();

  // Gyldige omtaler: i kanaler/feeden kan alle nevnes; i grupper/DM kun medlemmer.
  let validMentions = mentionUserIds.filter((id) => id !== authorId);
  const openTypes = ["channel", "feed"];
  if (!openTypes.includes(conversation.type) && validMentions.length) {
    const members = await db.query.onPoyntConversationMember.findMany({
      where: and(
        eq(onPoyntConversationMember.conversationId, conversation.id),
        inArray(onPoyntConversationMember.userId, validMentions)
      ),
      columns: { userId: true },
    });
    const memberIds = new Set(members.map((m) => m.userId));
    validMentions = validMentions.filter((id) => memberIds.has(id));
  }
  for (const id of validMentions) {
    recipients.set(id, "mention");
  }

  // DM: varsle motparten om ny melding (med mindre allerede en omtale).
  if (conversation.type === "dm") {
    const others = await db
      .select({ userId: onPoyntConversationMember.userId })
      .from(onPoyntConversationMember)
      .where(
        and(
          eq(onPoyntConversationMember.conversationId, conversation.id),
          ne(onPoyntConversationMember.userId, authorId)
        )
      );
    for (const o of others) {
      if (!recipients.has(o.userId)) recipients.set(o.userId, "dm");
    }
  }

  // Feed: en kommentar varsler innleggs-forfatteren.
  if (conversation.type === "feed" && parentMessageId) {
    const parent = await db.query.onPoyntMessage.findFirst({
      where: eq(onPoyntMessage.id, parentMessageId),
      columns: { authorId: true },
    });
    if (
      parent &&
      parent.authorId !== authorId &&
      !recipients.has(parent.authorId)
    ) {
      recipients.set(parent.authorId, "comment");
    }
  }

  if (recipients.size === 0) return;

  await db.insert(onPoyntNotification).values(
    Array.from(recipients.entries()).map(([userId, type]) => ({
      id: nanoid(),
      userId,
      type,
      actorId: authorId,
      conversationId: conversation.id,
      messageId,
    }))
  );

  // Web Push — samme mottakere får et push-varsel (no-op om VAPID ikke er satt).
  const actor = await db.query.onPoyntUser.findFirst({
    where: eq(onPoyntUser.id, authorId),
    columns: { name: true },
  });
  const actorName = actor?.name ?? "Noen";
  const where =
    conversation.type === "channel" && conversation.name
      ? ` i # ${conversation.name}`
      : conversation.type === "group" && conversation.name
        ? ` i ${conversation.name}`
        : "";
  const url = `/on-poynt/fellesskap?c=${conversation.id}`;

  await Promise.all(
    Array.from(recipients.entries()).map(([userId, type]) =>
      sendPushToUser(userId, {
        title:
          type === "mention"
            ? `${actorName} nevnte deg`
            : type === "comment"
              ? `${actorName} kommenterte innlegget ditt`
              : actorName,
        body:
          type === "mention"
            ? `Du ble nevnt${where}`
            : type === "comment"
              ? "Se svaret i fellesskapet"
              : "Sendte deg en melding",
        url,
      })
    )
  );
}

/**
 * Upsert lesestatus til «nå» for (bruker, samtale).
 */
async function markConversationRead(userId: string, conversationId: string) {
  const existing = await db.query.onPoyntConversationRead.findFirst({
    where: and(
      eq(onPoyntConversationRead.conversationId, conversationId),
      eq(onPoyntConversationRead.userId, userId)
    ),
  });
  if (existing) {
    await db
      .update(onPoyntConversationRead)
      .set({ lastReadAt: new Date() })
      .where(eq(onPoyntConversationRead.id, existing.id));
  } else {
    await db.insert(onPoyntConversationRead).values({
      id: nanoid(),
      conversationId,
      userId,
      lastReadAt: new Date(),
    });
  }
}
