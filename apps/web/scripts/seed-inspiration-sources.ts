/**
 * Seeder en startpakke med inspirasjonskilder for Innholdsradaren (Fase 3).
 * Idempotent: hopper over kilder hvis URL-en allerede finnes. Trygt å kjøre
 * flere ganger. Se docs/CONTENT-RADAR.md.
 *
 * Kildene er valgt for å fange opp «hva er hot» for et norsk småbedrifts-
 * publikum — radaren destillerer dem til temaer og flagger det dere ikke
 * dekker ennå. Alle er offentlige RSS-feeds (testet at de svarer).
 *
 *   bun run --cwd apps/web payload run scripts/seed-inspiration-sources.ts
 */
import { db } from "@poynt/planner-db";
import { plannerInspirationSource } from "@poynt/planner-db/schema";

type Seed = {
  label: string;
  url: string;
  type: "rss" | "website";
  personName?: string;
  note?: string;
};

const SOURCES: Seed[] = [
  {
    label: "Google Trends Norge",
    url: "https://trends.google.com/trending/rss?geo=NO",
    type: "rss",
  },
  {
    label: "Hacker News (forsiden)",
    url: "https://hnrss.org/frontpage",
    type: "rss",
  },
  {
    label: "HubSpot Marketing-blogg",
    url: "https://blog.hubspot.com/marketing/rss.xml",
    type: "rss",
  },
  {
    label: "Ahrefs SEO-blogg",
    url: "https://ahrefs.com/blog/feed/",
    type: "rss",
  },
  {
    label: "E24 Næringsliv",
    url: "https://e24.no/rss",
    type: "rss",
  },
  // Reddit funker, men rate-limiter og blokkerer ofte sky-IP-er (Vercel).
  // Feiler pent per kilde — fjern dem om de gir for mye støy.
  {
    label: "Reddit – r/smallbusiness",
    url: "https://www.reddit.com/r/smallbusiness/hot/.rss",
    type: "rss",
    note: "Kan bli rate-limitet fra Vercel",
  },
  {
    label: "Reddit – r/Entrepreneur",
    url: "https://www.reddit.com/r/Entrepreneur/top.rss",
    type: "rss",
    note: "Kan bli rate-limitet fra Vercel",
  },
];

const existing = await db
  .select({ url: plannerInspirationSource.url })
  .from(plannerInspirationSource);
const seen = new Set(existing.map((e) => e.url));

let created = 0;
for (const s of SOURCES) {
  if (seen.has(s.url)) {
    console.log(`– hopper over (finnes): ${s.label}`);
    continue;
  }
  await db.insert(plannerInspirationSource).values({
    label: s.label,
    url: s.url,
    type: s.type,
    personName: s.personName ?? null,
    isActive: true,
  });
  created += 1;
  console.log(`✓ ${s.label}${s.note ? `  (${s.note})` : ""}`);
}

console.log(`\nFerdig: ${created} nye kilder lagt til (${SOURCES.length} totalt i pakken).`);
