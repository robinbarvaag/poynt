/**
 * Seeder realistiske innlegg på fellesskapets vegg (feed) — med bilder,
 * kommentarer og reaksjoner. Gjenbruker seed-medlemmene fra
 * seed-community-messages.ts (kjør den først, eller la denne opprette dem).
 *
 *   bun apps/web/scripts/seed-feed-posts.ts
 */
import {
  db,
  eq,
  inArray,
  plannerConversation,
  plannerMessage,
  plannerMessageAttachment,
  plannerMessageReaction,
  plannerUser,
} from "@poynt/planner-db";

const DAY = 86_400_000;
const MIN = 60_000;

const PEOPLE = {
  susanne: { name: "Susanne Lid", email: "seed-susanne@poynt.test" },
  aksel: { name: "Aksel Berg", email: "seed-aksel@poynt.test" },
  mariam: { name: "Mariam Haugen", email: "seed-mariam@poynt.test" },
  jonas: { name: "Jonas Vik", email: "seed-jonas@poynt.test" },
} as const;
type PersonKey = keyof typeof PEOPLE;

type SeedPost = {
  who: PersonKey;
  body: string;
  daysAgo: number;
  minsAgo: number;
  images?: string[]; // picsum-seeds
  reactions?: { who: PersonKey; emoji: string }[];
  comments?: { who: PersonKey; body: string; minsAfter: number }[];
};

const POSTS: SeedPost[] = [
  {
    who: "susanne",
    daysAgo: 2,
    minsAgo: 300,
    body: "Velkommen til den nye veggen vår! 🎉 Her deler vi seire, spørsmål og alt som skjer. Første oppdrag: del ett mål du har for markedsføringen denne måneden 👇",
    reactions: [
      { who: "aksel", emoji: "🎉" },
      { who: "mariam", emoji: "❤️" },
      { who: "jonas", emoji: "🙌" },
    ],
    comments: [
      {
        who: "aksel",
        body: "Mitt mål: poste tre Reels i uka uten å gruble meg i hjel 😅",
        minsAfter: 25,
      },
      {
        who: "mariam",
        body: "Endelig! Målet mitt er å få opp nyhetsbrevet igjen 💌",
        minsAfter: 60,
      },
    ],
  },
  {
    who: "aksel",
    daysAgo: 1,
    minsAgo: 500,
    body: "Første forsøk på «bak kulissene»-innhold fra bakeriet i dag. Litt skummelt å vise frem rotet, men responsen var helt vill! 🥐 Takk for pushet, @Susanne Lid!",
    images: ["bakverk", "kafe"],
    reactions: [
      { who: "susanne", emoji: "🔥" },
      { who: "mariam", emoji: "🔥" },
      { who: "jonas", emoji: "👍" },
    ],
    comments: [
      {
        who: "susanne",
        body: "DETTE er akkurat det folk vil se! Autentisk > polert, hver gang 👏",
        minsAfter: 40,
      },
    ],
  },
  {
    who: "jonas",
    daysAgo: 0,
    minsAgo: 200,
    body: "Spørsmål: hvor ofte poster dere på LinkedIn? Føler jeg enten spammer eller forsvinner helt 🤔",
    reactions: [{ who: "aksel", emoji: "👀" }],
    comments: [
      {
        who: "susanne",
        body: "2–3 ganger i uka er masse! Heller jevnt og relevant enn ofte og tynt 😊",
        minsAfter: 15,
      },
      {
        who: "mariam",
        body: "Jeg poster én gang i uka og det funker fint for meg!",
        minsAfter: 45,
      },
    ],
  },
];

async function ensurePerson(key: PersonKey) {
  const p = PEOPLE[key];
  const existing = await db.query.plannerUser.findFirst({
    where: eq(plannerUser.email, p.email),
  });
  const image = `https://i.pravatar.cc/200?u=${encodeURIComponent(p.email)}`;
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await db.insert(plannerUser).values({
    id,
    name: p.name,
    email: p.email,
    canonicalEmail: p.email,
    emailVerified: true,
    image,
    role: "user",
  });
  return id;
}

async function run() {
  const ids: Record<PersonKey, string> = {} as Record<PersonKey, string>;
  for (const key of Object.keys(PEOPLE) as PersonKey[]) {
    ids[key] = await ensurePerson(key);
  }

  // Feed-samtalen (opprett hvis den ikke finnes — samme logikk som getFeed).
  let feed = await db.query.plannerConversation.findFirst({
    where: eq(plannerConversation.type, "feed"),
  });
  if (!feed) {
    await db
      .insert(plannerConversation)
      .values({
        id: crypto.randomUUID(),
        type: "feed",
        name: "Innlegg",
        slug: "innlegg",
        description: "Fellesskapets vegg — del, spør og feir.",
      })
      .onConflictDoNothing({ target: plannerConversation.slug });
    feed = await db.query.plannerConversation.findFirst({
      where: eq(plannerConversation.type, "feed"),
    });
  }
  if (!feed) throw new Error("Kunne ikke opprette feed-samtalen");

  // Rydd seed-brukernes gamle innlegg i feeden (cascade tar kommentarer m.m.)
  const old = await db.query.plannerMessage.findMany({
    where: eq(plannerMessage.conversationId, feed.id),
    columns: { id: true, authorId: true },
  });
  const oldIds = old
    .filter((m) => Object.values(ids).includes(m.authorId))
    .map((m) => m.id);
  if (oldIds.length) {
    await db.delete(plannerMessage).where(inArray(plannerMessage.id, oldIds));
  }

  const now = Date.now();
  for (const post of POSTS) {
    const postId = crypto.randomUUID();
    const createdAt = new Date(now - post.daysAgo * DAY - post.minsAgo * MIN);
    await db.insert(plannerMessage).values({
      id: postId,
      conversationId: feed.id,
      authorId: ids[post.who],
      body: post.body,
      createdAt,
    });

    for (const seed of post.images ?? []) {
      await db.insert(plannerMessageAttachment).values({
        id: crypto.randomUUID(),
        messageId: postId,
        url: `https://picsum.photos/seed/${seed}/900/650`,
        fileName: `${seed}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 180_000,
        width: 900,
        height: 650,
      });
    }
    for (const r of post.reactions ?? []) {
      await db.insert(plannerMessageReaction).values({
        id: crypto.randomUUID(),
        messageId: postId,
        userId: ids[r.who],
        emoji: r.emoji,
      });
    }
    for (const c of post.comments ?? []) {
      await db.insert(plannerMessage).values({
        id: crypto.randomUUID(),
        conversationId: feed.id,
        authorId: ids[c.who],
        body: c.body,
        parentMessageId: postId,
        createdAt: new Date(createdAt.getTime() + c.minsAfter * MIN),
      });
    }
    console.log(`  ✓ ${post.who}: ${post.body.slice(0, 50)}…`);
  }

  console.log(`\nSeedet ${POSTS.length} innlegg på veggen.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed feilet:", err);
  process.exit(1);
});
