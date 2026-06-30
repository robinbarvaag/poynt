/**
 * Integrasjonstest for medlemsfellesskapet — kjører hele chat-routeren mot den
 * ekte databasen via tRPC-caller (ingen browser/auth nødvendig). Oppretter to
 * test-brukere, kjører gjennom flyten, og rydder opp til slutt.
 *
 *   bun apps/web/scripts/test-community.ts   (fra repo-rot)
 */
import { appRouter } from "@poynt/planner-api";
import { db, eq, plannerConversation, plannerUser } from "@poynt/planner-db";

function log(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  log(msg);
}

async function ensureUser(email: string, name: string, role: "user" | "admin") {
  const existing = await db.query.plannerUser.findFirst({
    where: eq(plannerUser.email, email),
  });
  if (existing) {
    if (existing.role !== role) {
      await db
        .update(plannerUser)
        .set({ role })
        .where(eq(plannerUser.id, existing.id));
    }
    return existing.id;
  }
  const id = crypto.randomUUID();
  await db.insert(plannerUser).values({
    id,
    name,
    email,
    canonicalEmail: email,
    emailVerified: true,
    role,
  });
  return id;
}

async function run() {
  const createdConversationIds: string[] = [];
  const userAId = await ensureUser(
    "community-test-a@poynt.test",
    "Test Aase",
    "admin"
  );
  const userBId = await ensureUser(
    "community-test-b@poynt.test",
    "Test Bjørn",
    "user"
  );
  const A = appRouter.createCaller({ userId: userAId });
  const B = appRouter.createCaller({ userId: userBId });

  try {
    // ---- De to som feiler i prod (500): listConversations + unreadCount ----
    console.log("\n[1] listConversations + unreadCount (de som 500-er):");
    const convos = await A.chat.listConversations();
    assert(Array.isArray(convos), "listConversations returnerer en liste");
    const unread = await A.chat.unreadCount();
    assert(typeof unread.total === "number", "unreadCount.total er et tall");
    const notifCount = await A.chat.unreadNotificationCount();
    assert(
      typeof notifCount.total === "number",
      "unreadNotificationCount.total er et tall"
    );

    // ---- Kanal + melding ----
    console.log("\n[2] Kanal + melding:");
    const channel = await A.chat.createChannel({
      name: "Testkanal (slettes)",
      description: "midlertidig",
    });
    assert(!!channel?.id, "createChannel gir en id");
    if (channel?.id) createdConversationIds.push(channel.id);
    const channelId = channel?.id as string;

    const msg = await A.chat.sendMessage({
      conversationId: channelId,
      body: `Hei @${"Test Bjørn"}!`,
      mentionUserIds: [userBId],
    });
    assert(!!msg.id, "sendMessage gir melding");

    const page = await A.chat.getMessages({ conversationId: channelId });
    assert(page.messages.length === 1, "getMessages: 1 melding");
    assert(page.messages[0]?.author.id === userAId, "riktig forfatter");

    // ---- Omtale → varsel hos B ----
    console.log("\n[3] Omtale-varsel:");
    const bNotifs = await B.chat.listNotifications();
    assert(
      bNotifs.some(
        (n) => n.type === "mention" && n.conversationId === channelId
      ),
      "B fikk et mention-varsel"
    );
    const bUnreadNotif = await B.chat.unreadNotificationCount();
    assert(bUnreadNotif.total >= 1, "B har uleste varsler");

    // ---- Reaksjon ----
    console.log("\n[4] Reaksjon:");
    const r1 = await B.chat.toggleReaction({ messageId: msg.id, emoji: "👍" });
    assert(r1.reacted === true, "toggleReaction på = true");
    const page2 = await A.chat.getMessages({ conversationId: channelId });
    assert(
      page2.messages[0]?.reactions.some(
        (r) => r.emoji === "👍" && r.count === 1
      ),
      "reaksjon teller 1"
    );
    const r2 = await B.chat.toggleReaction({ messageId: msg.id, emoji: "👍" });
    assert(r2.reacted === false, "toggleReaction av = false");

    // ---- Svar (reply/sitat) ----
    console.log("\n[5] Svar:");
    const reply = await A.chat.sendMessage({
      conversationId: channelId,
      body: "Svar på den forrige",
      parentMessageId: msg.id,
    });
    const page3 = await A.chat.getMessages({ conversationId: channelId });
    const replyRow = page3.messages.find((m) => m.id === reply.id);
    assert(replyRow?.replyTo?.id === msg.id, "replyTo peker på foreldre");

    // ---- Rediger + slett ----
    console.log("\n[6] Rediger + slett:");
    await A.chat.editMessage({ messageId: msg.id, body: "Redigert tekst" });
    const page4 = await A.chat.getMessages({ conversationId: channelId });
    const edited = page4.messages.find((m) => m.id === msg.id);
    assert(edited?.body === "Redigert tekst", "melding redigert");
    assert(!!edited?.editedAt, "editedAt satt");
    await A.chat.deleteMessage({ messageId: reply.id });
    const page5 = await A.chat.getMessages({ conversationId: channelId });
    assert(
      !page5.messages.some((m) => m.id === reply.id),
      "slettet melding borte fra tråden"
    );

    // ---- DM ----
    console.log("\n[7] DM:");
    const dm = await A.chat.createDm({ userId: userBId });
    assert(!!dm.id, "createDm gir id");
    createdConversationIds.push(dm.id);
    const dm2 = await A.chat.createDm({ userId: userBId });
    assert(dm2.id === dm.id, "createDm gjenbruker eksisterende DM");
    await A.chat.sendMessage({ conversationId: dm.id, body: "Hei på DM" });
    const bNotifs2 = await B.chat.listNotifications();
    assert(
      bNotifs2.some((n) => n.type === "dm" && n.conversationId === dm.id),
      "B fikk dm-varsel"
    );

    // ---- Gruppe ----
    console.log("\n[8] Gruppe:");
    const group = await A.chat.createGroup({
      name: "Testgruppe",
      memberIds: [userBId],
    });
    assert(!!group.id, "createGroup gir id");
    createdConversationIds.push(group.id);
    const members = await A.chat.getConversationMembers({
      conversationId: group.id,
    });
    assert(members.length === 2, "gruppa har 2 medlemmer");
    await A.chat.renameConversation({
      conversationId: group.id,
      name: "Døpt om",
    });
    await B.chat.leaveConversation({ conversationId: group.id });
    const membersAfter = await A.chat.getConversationMembers({
      conversationId: group.id,
    });
    assert(membersAfter.length === 1, "B forlot gruppa");

    // ---- markRead nullstiller uleste ----
    console.log("\n[9] markRead:");
    await B.chat.markRead({ conversationId: dm.id });
    log("markRead kjørte uten feil");

    // ---- Read-branch: listConversations/unreadCount ETTER en lesestatus med
    // lastReadAt (regresjonen som 500-et i prod — Date i sql-template). ----
    console.log("\n[10] unread-branch etter lesestatus:");
    await B.chat.markRead({ conversationId: channelId });
    const convosAfterRead = await B.chat.listConversations();
    assert(
      Array.isArray(convosAfterRead),
      "listConversations OK med lesestatus (Date-bind-regresjon)"
    );
    const unreadAfterRead = await B.chat.unreadCount();
    assert(
      typeof unreadAfterRead.total === "number",
      "unreadCount OK med lesestatus"
    );

    console.log("\n✅ ALLE TESTER PASSERTE\n");
  } catch (err) {
    console.error("\n❌ TEST FEILET:\n", err);
    throw err;
  } finally {
    // Rydd opp: slett samtaler vi opprettet (cascade fjerner meldinger/varsler/
    // reaksjoner/medlemmer), deretter test-brukerne.
    for (const id of createdConversationIds) {
      await db
        .delete(plannerConversation)
        .where(eq(plannerConversation.id, id));
    }
    await db
      .delete(plannerUser)
      .where(eq(plannerUser.email, "community-test-a@poynt.test"));
    await db
      .delete(plannerUser)
      .where(eq(plannerUser.email, "community-test-b@poynt.test"));
    console.log("🧹 Ryddet opp testdata.");
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
