/**
 * Seeder en realistisk testsamtale i #generelt med flere medlemmer, bilder
 * (stock fra picsum), en fil, @-omtaler, et svar og reaksjoner — fordelt over
 * i går + i dag (så dato-skillene vises). Idempotent: sletter seed-brukernes
 * gamle meldinger først.
 *
 *   bun apps/web/scripts/seed-community-messages.ts
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

// Seed-medlemmer (pravatar gir ekte ansikts-avatarer).
const PEOPLE = {
  susanne: { name: "Susanne Lid", email: "seed-susanne@poynt.test" },
  aksel: { name: "Aksel Berg", email: "seed-aksel@poynt.test" },
  mariam: { name: "Mariam Haugen", email: "seed-mariam@poynt.test" },
  jonas: { name: "Jonas Vik", email: "seed-jonas@poynt.test" },
} as const;
type PersonKey = keyof typeof PEOPLE;

type SeedMsg = {
  who: PersonKey;
  body?: string;
  daysAgo: number;
  minsAgo: number;
  images?: { url: string; name: string; w: number; h: number }[];
  files?: { url: string; name: string; mime: string; size: number }[];
  reactions?: { who: PersonKey; emoji: string }[];
  replyTo?: number; // indeks i THREAD
};

const img = (seed: string, name: string) => ({
  url: `https://picsum.photos/seed/${seed}/900/650`,
  name,
  w: 900,
  h: 650,
});

const THREAD: SeedMsg[] = [
  {
    who: "susanne",
    daysAgo: 1,
    minsAgo: 240,
    body: "Velkommen til fellesskapet, folkens! 🎉 Her deler vi tips, spør om hjelp og heier på hverandre.",
  },
  {
    who: "susanne",
    daysAgo: 1,
    minsAgo: 239,
    body: "Start gjerne med å si hei og fortell litt om hva du driver med 👇",
  },
  {
    who: "aksel",
    daysAgo: 1,
    minsAgo: 210,
    body: "Hei! Aksel her, driver et lite bakeri på Grünerløkka. Gleder meg til å lære mer om innholdsmarkedsføring 🥐",
    reactions: [
      { who: "susanne", emoji: "👍" },
      { who: "mariam", emoji: "❤️" },
    ],
  },
  {
    who: "mariam",
    daysAgo: 1,
    minsAgo: 200,
    body: "Hei alle! Mariam, frilans-fotograf 📸 @Aksel Berg det der ser jo nydelig ut!",
    images: [img("bakeri", "ferske-rundstykker.jpg")],
    reactions: [{ who: "aksel", emoji: "🔥" }],
  },
  {
    who: "aksel",
    daysAgo: 1,
    minsAgo: 198,
    body: "Tusen takk @Mariam Haugen! Vi prøver så godt vi kan 😊",
    replyTo: 3,
  },
  {
    who: "susanne",
    daysAgo: 1,
    minsAgo: 180,
    body: "Elsker å se dette! 🙌 Husk at dere kan bruke #vis-frem-kanalen for å vise frem arbeidet deres.",
  },
  {
    who: "jonas",
    daysAgo: 0,
    minsAgo: 150,
    body: "Noen som har erfaring med å lage innhold til Reels? Sliter litt med å komme i gang 😅",
    reactions: [{ who: "mariam", emoji: "👀" }],
  },
  {
    who: "mariam",
    daysAgo: 0,
    minsAgo: 140,
    body: "@Jonas Vik jeg har en enkel mal jeg bruker — kommer straks!",
    replyTo: 6,
  },
  {
    who: "mariam",
    daysAgo: 0,
    minsAgo: 138,
    body: "Her er den! Bare å bruke fritt 🎬",
    files: [
      {
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        name: "reels-mal.pdf",
        mime: "application/pdf",
        size: 24_500,
      },
    ],
    reactions: [
      { who: "jonas", emoji: "🙌" },
      { who: "susanne", emoji: "❤️" },
      { who: "aksel", emoji: "👍" },
    ],
  },
  {
    who: "susanne",
    daysAgo: 0,
    minsAgo: 30,
    body: "Minner om webinaret på torsdag 📅 Lenke kommer i morgen tidlig!",
    images: [img("webinar", "webinar-flyer.jpg")],
  },
  {
    who: "jonas",
    daysAgo: 0,
    minsAgo: 6,
    body: "Gleder meg! Og takk for malen @Mariam Haugen 🔥",
    reactions: [{ who: "mariam", emoji: "😂" }],
  },
];

async function ensurePerson(key: PersonKey) {
  const p = PEOPLE[key];
  const existing = await db.query.plannerUser.findFirst({
    where: eq(plannerUser.email, p.email),
  });
  const image = `https://i.pravatar.cc/200?u=${encodeURIComponent(p.email)}`;
  if (existing) {
    await db
      .update(plannerUser)
      .set({ image, name: p.name })
      .where(eq(plannerUser.id, existing.id));
    return existing.id;
  }
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
  // 1) Brukere
  const ids: Record<PersonKey, string> = {} as Record<PersonKey, string>;
  for (const key of Object.keys(PEOPLE) as PersonKey[]) {
    ids[key] = await ensurePerson(key);
  }

  // 2) #generelt
  const channel = await db.query.plannerConversation.findFirst({
    where: eq(plannerConversation.slug, "generelt"),
  });
  if (!channel) {
    console.error(
      "Fant ikke #generelt — kjør seed-channels.ts først (bun apps/web/scripts/seed-channels.ts)."
    );
    process.exit(1);
  }

  // 3) Rydd vekk seed-brukernes gamle meldinger (cascade fjerner vedlegg/reaksjoner)
  await db
    .delete(plannerMessage)
    .where(inArray(plannerMessage.authorId, Object.values(ids)));

  // 4) Sett inn tråden
  const now = Date.now();
  const insertedIds: string[] = [];
  for (let i = 0; i < THREAD.length; i++) {
    const m = THREAD[i] as SeedMsg;
    const messageId = crypto.randomUUID();
    const createdAt = new Date(now - m.daysAgo * DAY - m.minsAgo * MIN);
    await db.insert(plannerMessage).values({
      id: messageId,
      conversationId: channel.id,
      authorId: ids[m.who],
      body: m.body ?? null,
      parentMessageId:
        m.replyTo !== undefined ? (insertedIds[m.replyTo] ?? null) : null,
      createdAt,
    });
    insertedIds.push(messageId);

    for (const im of m.images ?? []) {
      await db.insert(plannerMessageAttachment).values({
        id: crypto.randomUUID(),
        messageId,
        url: im.url,
        fileName: im.name,
        mimeType: "image/jpeg",
        sizeBytes: 180_000,
        width: im.w,
        height: im.h,
      });
    }
    for (const f of m.files ?? []) {
      await db.insert(plannerMessageAttachment).values({
        id: crypto.randomUUID(),
        messageId,
        url: f.url,
        fileName: f.name,
        mimeType: f.mime,
        sizeBytes: f.size,
      });
    }
    for (const r of m.reactions ?? []) {
      await db.insert(plannerMessageReaction).values({
        id: crypto.randomUUID(),
        messageId,
        userId: ids[r.who],
        emoji: r.emoji,
      });
    }
    console.log(`  ✓ ${m.who}: ${(m.body ?? "[vedlegg]").slice(0, 48)}`);
  }

  console.log(
    `\nSeedet ${THREAD.length} meldinger i #generelt fra ${
      Object.keys(PEOPLE).length
    } medlemmer.`
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed feilet:", err);
  process.exit(1);
});
