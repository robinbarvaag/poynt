/**
 * Oppretter standard-kanalene i medlemsfellesskapet. Idempotent — kjører trygt
 * flere ganger (hopper over kanaler som allerede finnes på slug).
 *
 *   bun run --cwd apps/web payload run scripts/seed-channels.ts
 */
import { db } from "@poynt/planner-db";
import { plannerConversation } from "@poynt/planner-db/schema";

const channels = [
  {
    slug: "generelt",
    name: "Generelt",
    description: "Allmenn prat for alle medlemmer.",
  },
  {
    slug: "spor-poynt",
    name: "Spør Poynt",
    description: "Spørsmål til Susanne og teamet.",
  },
  {
    slug: "vis-frem",
    name: "Vis frem",
    description: "Del det du har laget – få tilbakemelding fra de andre.",
  },
  {
    slug: "tips-og-triks",
    name: "Tips og triks",
    description: "Smarte grep for markedsføring og innhold.",
  },
];

async function run() {
  for (const c of channels) {
    await db
      .insert(plannerConversation)
      .values({
        id: crypto.randomUUID(),
        type: "channel",
        name: c.name,
        slug: c.slug,
        description: c.description,
      })
      .onConflictDoNothing({ target: plannerConversation.slug });
    console.log(`✓ #${c.slug}`);
  }

  console.log(`\nSeedet ${channels.length} kanaler.`);
  process.exit(0);
}

run().catch((error) => {
  console.error("Klarte ikke seede kanaler:", error);
  process.exit(1);
});
