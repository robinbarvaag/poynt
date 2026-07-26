import { db } from "@poynt/planner-db";
import {
  plannerConversation,
  plannerConversationMember,
  plannerConversationRead,
  plannerMessage,
  plannerMessageAttachment,
  plannerMessageReaction,
  plannerNotification,
  plannerPushSubscription,
  plannerUser,
} from "@poynt/planner-db/schema";
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
} from "@poynt/planner-validators";
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

type ConversationRow = typeof plannerConversation.$inferSelect;

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

type MessageWithRelations = typeof plannerMessage.$inferSelect & {
  author: { id: string; name: string; image: string | null };
  attachments: (typeof plannerMessageAttachment.$inferSelect)[];
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
  const existing = await db.query.plannerConversation.findFirst({
    where: eq(plannerConversation.type, "feed"),
  });
  if (existing) return existing;

  await db
    .insert(plannerConversation)
    .values({
      id: nanoid(),
      type: "feed",
      name: "Innlegg",
      slug: "innlegg",
      description: "Fellesskapets vegg — del, spør og feir.",
    })
    .onConflictDoNothing({ target: plannerConversation.slug });

  const created = await db.query.plannerConversation.findFirst({
    where: eq(plannerConversation.type, "feed"),
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
  const conversation = await db.query.plannerConversation.findFirst({
    where: eq(plannerConversation.id, conversationId),
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

  const member = await db.query.plannerConversationMember.findFirst({
    where: and(
      eq(plannerConversationMember.conversationId, conversationId),
      eq(plannerConversationMember.userId, userId)
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
        id: plannerUser.id,
        name: plannerUser.name,
        image: plannerUser.image,
      })
      .from(plannerConversationMember)
      .innerJoin(
        plannerUser,
        eq(plannerConversationMember.userId, plannerUser.id)
      )
      .where(
        and(
          eq(plannerConversationMember.conversationId, conversation.id),
          ne(plannerConversationMember.userId, userId)
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
      body: plannerMessage.body,
      createdAt: plannerMessage.createdAt,
      authorName: plannerUser.name,
    })
    .from(plannerMessage)
    .innerJoin(plannerUser, eq(plannerMessage.authorId, plannerUser.id))
    .where(
      and(
        eq(plannerMessage.conversationId, conversation.id),
        isNull(plannerMessage.deletedAt)
      )
    )
    .orderBy(desc(plannerMessage.createdAt))
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
  const read = await db.query.plannerConversationRead.findFirst({
    where: and(
      eq(plannerConversationRead.conversationId, conversationId),
      eq(plannerConversationRead.userId, userId)
    ),
  });

  const conditions = [
    eq(plannerMessage.conversationId, conversationId),
    isNull(plannerMessage.deletedAt),
    ne(plannerMessage.authorId, userId),
  ];
  if (read?.lastReadAt) {
    conditions.push(gt(plannerMessage.createdAt, read.lastReadAt));
  }
  const [row] = await db
    .select({ unread: sql<number>`cast(count(*) as int)` })
    .from(plannerMessage)
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

    const channels = await db.query.plannerConversation.findMany({
      where: and(
        eq(plannerConversation.type, "channel"),
        eq(plannerConversation.isArchived, false)
      ),
    });

    const memberships = await db.query.plannerConversationMember.findMany({
      where: eq(plannerConversationMember.userId, userId),
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
        eq(plannerMessage.conversationId, input.conversationId),
        isNull(plannerMessage.deletedAt),
      ];
      if (input.before) {
        where.push(lt(plannerMessage.createdAt, new Date(input.before)));
      }

      const rows = await db.query.plannerMessage.findMany({
        where: and(...where),
        with: { author: true, attachments: true, reactions: true },
        orderBy: desc(plannerMessage.createdAt),
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
        ? await db.query.plannerMessage.findMany({
            where: inArray(plannerMessage.id, parentIds),
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
        const parent = await db.query.plannerMessage.findFirst({
          where: eq(plannerMessage.id, input.parentMessageId),
          columns: { id: true, conversationId: true },
        });
        if (parent?.conversationId === input.conversationId) {
          parentMessageId = parent.id;
        }
      }

      await db.insert(plannerMessage).values({
        id: messageId,
        conversationId: input.conversationId,
        authorId: userId,
        parentMessageId,
        body,
      });

      if (input.attachments?.length) {
        await db.insert(plannerMessageAttachment).values(
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

      const created = await db.query.plannerMessage.findFirst({
        where: eq(plannerMessage.id, messageId),
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
      const message = await db.query.plannerMessage.findFirst({
        where: eq(plannerMessage.id, input.messageId),
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
        .update(plannerMessage)
        .set({ body: input.body.trim(), editedAt: new Date() })
        .where(eq(plannerMessage.id, input.messageId));
      return { success: true };
    }),

  /**
   * Slett egen melding (soft-delete — forsvinner fra tråden).
   */
  deleteMessage: memberProcedure
    .input(deleteMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const message = await db.query.plannerMessage.findFirst({
        where: eq(plannerMessage.id, input.messageId),
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
        .update(plannerMessage)
        .set({ deletedAt: new Date() })
        .where(eq(plannerMessage.id, input.messageId));
      return { success: true };
    }),

  /**
   * Slå en emoji-reaksjon på/av for en melding.
   */
  toggleReaction: memberProcedure
    .input(toggleReactionSchema)
    .mutation(async ({ ctx, input }) => {
      const message = await db.query.plannerMessage.findFirst({
        where: eq(plannerMessage.id, input.messageId),
        columns: { id: true, conversationId: true },
      });
      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meldingen finnes ikke",
        });
      }
      await getAccessibleConversation(ctx.userId, message.conversationId);

      const existing = await db.query.plannerMessageReaction.findFirst({
        where: and(
          eq(plannerMessageReaction.messageId, input.messageId),
          eq(plannerMessageReaction.userId, ctx.userId),
          eq(plannerMessageReaction.emoji, input.emoji)
        ),
      });

      if (existing) {
        await db
          .delete(plannerMessageReaction)
          .where(eq(plannerMessageReaction.id, existing.id));
        return { reacted: false };
      }

      await db.insert(plannerMessageReaction).values({
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

      const exists = await db.query.plannerConversation.findFirst({
        where: eq(plannerConversation.slug, slug),
      });
      if (exists) {
        slug = `${slug}-${nanoid(4)}`;
      }

      const [channel] = await db
        .insert(plannerConversation)
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
        .update(plannerConversation)
        .set({
          name: input.name,
          description:
            input.description === undefined
              ? undefined
              : input.description || null,
          icon: input.icon === undefined ? undefined : input.icon || null,
          isArchived: input.isArchived,
        })
        .where(eq(plannerConversation.id, input.id))
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

      await db.insert(plannerConversation).values({
        id: conversationId,
        type: "group",
        name: input.name,
        createdById: userId,
      });

      const memberIds = Array.from(new Set([userId, ...input.memberIds]));
      await db.insert(plannerConversationMember).values(
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
      const mine = await db.query.plannerConversationMember.findMany({
        where: eq(plannerConversationMember.userId, userId),
        with: { conversation: true },
      });
      const dmIds = mine
        .filter((m) => m.conversation.type === "dm")
        .map((m) => m.conversationId);
      if (dmIds.length) {
        const shared = await db.query.plannerConversationMember.findFirst({
          where: and(
            inArray(plannerConversationMember.conversationId, dmIds),
            eq(plannerConversationMember.userId, input.userId)
          ),
        });
        if (shared) return { id: shared.conversationId };
      }

      const conversationId = nanoid();
      await db.insert(plannerConversation).values({
        id: conversationId,
        type: "dm",
        createdById: userId,
      });
      await db.insert(plannerConversationMember).values([
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

      const members = await db.query.plannerConversationMember.findMany({
        where: eq(
          plannerConversationMember.conversationId,
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

      const existing = await db.query.plannerConversationMember.findMany({
        where: eq(
          plannerConversationMember.conversationId,
          input.conversationId
        ),
        columns: { userId: true },
      });
      const have = new Set(existing.map((m) => m.userId));
      const toAdd = Array.from(new Set(input.memberIds)).filter(
        (id) => !have.has(id)
      );
      if (toAdd.length === 0) return { added: 0 };

      await db.insert(plannerConversationMember).values(
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
        .delete(plannerConversationMember)
        .where(
          and(
            eq(plannerConversationMember.conversationId, input.conversationId),
            eq(plannerConversationMember.userId, ctx.userId)
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
        .update(plannerConversation)
        .set({ name: input.name })
        .where(eq(plannerConversation.id, input.conversationId));
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
      const conditions = [ne(plannerUser.id, ctx.userId)];
      if (search) {
        conditions.push(
          sql`(${ilike(plannerUser.name, `%${search}%`)} or ${ilike(
            plannerUser.email,
            `%${search}%`
          )})`
        );
      }

      const members = await db
        .select({
          id: plannerUser.id,
          name: plannerUser.name,
          image: plannerUser.image,
        })
        .from(plannerUser)
        .where(and(...conditions))
        .orderBy(asc(plannerUser.name))
        .limit(100);

      return members;
    }),

  /**
   * Totalt antall uleste meldinger på tvers av alle samtaler brukeren ser —
   * driver uleste-merket i menyen.
   */
  unreadCount: memberProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const channels = await db.query.plannerConversation.findMany({
      where: and(
        eq(plannerConversation.type, "channel"),
        eq(plannerConversation.isArchived, false)
      ),
      columns: { id: true },
    });

    const memberships = await db.query.plannerConversationMember.findMany({
      where: eq(plannerConversationMember.userId, userId),
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
      const rows = await db.query.plannerNotification.findMany({
        where: eq(plannerNotification.userId, ctx.userId),
        with: { actor: true, conversation: true },
        orderBy: desc(plannerNotification.createdAt),
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
      .from(plannerNotification)
      .where(
        and(
          eq(plannerNotification.userId, ctx.userId),
          isNull(plannerNotification.readAt)
        )
      );
    return { total: Number(row?.total) || 0 };
  }),

  /**
   * Marker alle varsler som lest.
   */
  markNotificationsRead: memberProcedure.mutation(async ({ ctx }) => {
    await db
      .update(plannerNotification)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(plannerNotification.userId, ctx.userId),
          isNull(plannerNotification.readAt)
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
          >`greatest(max(${plannerMessage.createdAt}), max(${plannerMessage.editedAt}), max(${plannerMessage.deletedAt}))`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(plannerMessage)
        .where(eq(plannerMessage.conversationId, input.conversationId));

      const [react] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(plannerMessageReaction)
        .innerJoin(
          plannerMessage,
          eq(plannerMessageReaction.messageId, plannerMessage.id)
        )
        .where(eq(plannerMessage.conversationId, input.conversationId));

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
        eq(plannerMessage.conversationId, feed.id),
        isNull(plannerMessage.parentMessageId),
        isNull(plannerMessage.deletedAt),
      ];
      if (input?.before) {
        where.push(lt(plannerMessage.createdAt, new Date(input.before)));
      }

      const rows = await db.query.plannerMessage.findMany({
        where: and(...where),
        with: { author: true, attachments: true, reactions: true },
        orderBy: desc(plannerMessage.createdAt),
        limit,
      });

      // Kommentar-antall i én batch.
      const postIds = rows.map((r) => r.id);
      const counts = postIds.length
        ? await db
            .select({
              parentId: plannerMessage.parentMessageId,
              count: sql<number>`cast(count(*) as int)`,
            })
            .from(plannerMessage)
            .where(
              and(
                inArray(plannerMessage.parentMessageId, postIds),
                isNull(plannerMessage.deletedAt)
              )
            )
            .groupBy(plannerMessage.parentMessageId)
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
      const post = await db.query.plannerMessage.findFirst({
        where: eq(plannerMessage.id, input.postId),
        columns: { id: true, conversationId: true },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Innlegget finnes ikke",
        });
      }
      await getAccessibleConversation(ctx.userId, post.conversationId);

      const rows = await db.query.plannerMessage.findMany({
        where: and(
          eq(plannerMessage.parentMessageId, input.postId),
          isNull(plannerMessage.deletedAt)
        ),
        with: { author: true, attachments: true, reactions: true },
        orderBy: asc(plannerMessage.createdAt),
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
      const existing = await db.query.plannerPushSubscription.findFirst({
        where: eq(plannerPushSubscription.endpoint, input.endpoint),
      });
      if (existing) {
        await db
          .update(plannerPushSubscription)
          .set({
            userId: ctx.userId,
            p256dh: input.p256dh,
            auth: input.auth,
          })
          .where(eq(plannerPushSubscription.endpoint, input.endpoint));
      } else {
        await db.insert(plannerPushSubscription).values({
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
        .delete(plannerPushSubscription)
        .where(
          and(
            eq(plannerPushSubscription.endpoint, input.endpoint),
            eq(plannerPushSubscription.userId, ctx.userId)
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
    const members = await db.query.plannerConversationMember.findMany({
      where: and(
        eq(plannerConversationMember.conversationId, conversation.id),
        inArray(plannerConversationMember.userId, validMentions)
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
      .select({ userId: plannerConversationMember.userId })
      .from(plannerConversationMember)
      .where(
        and(
          eq(plannerConversationMember.conversationId, conversation.id),
          ne(plannerConversationMember.userId, authorId)
        )
      );
    for (const o of others) {
      if (!recipients.has(o.userId)) recipients.set(o.userId, "dm");
    }
  }

  // Feed: en kommentar varsler innleggs-forfatteren.
  if (conversation.type === "feed" && parentMessageId) {
    const parent = await db.query.plannerMessage.findFirst({
      where: eq(plannerMessage.id, parentMessageId),
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

  await db.insert(plannerNotification).values(
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
  const actor = await db.query.plannerUser.findFirst({
    where: eq(plannerUser.id, authorId),
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
  const existing = await db.query.plannerConversationRead.findFirst({
    where: and(
      eq(plannerConversationRead.conversationId, conversationId),
      eq(plannerConversationRead.userId, userId)
    ),
  });
  if (existing) {
    await db
      .update(plannerConversationRead)
      .set({ lastReadAt: new Date() })
      .where(eq(plannerConversationRead.id, existing.id));
  } else {
    await db.insert(plannerConversationRead).values({
      id: nanoid(),
      conversationId,
      userId,
      lastReadAt: new Date(),
    });
  }
}
