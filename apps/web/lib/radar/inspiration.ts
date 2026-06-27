import config from "@payload-config";
import {
  distillInspiration,
  scrapeWebsite,
} from "@poynt/planner-api/lib/inspiration";
import { db, eq } from "@poynt/planner-db";
import {
  plannerInspirationItem,
  plannerInspirationSource,
} from "@poynt/planner-db/schema";
import type { PlannerInspirationSource } from "@poynt/planner-db/schema";
import { getPayload } from "payload";

/**
 * Inspirasjon — henting + destillering. Henter offentlig innhold fra registrerte
 * kilder (RSS-feed eller nettside via Firecrawl), lar AI-en destillere det til
 * tema-taggede notater, og lagrer dem som `planner_inspiration_item`. Disse
 * mates inn i gap-analysen (signals.ts) som `inspiration_gap`-signaler.
 *
 * Bevisst KUN offentlige feeds — aldri auth-gated profiler (LinkedIn/Twitter).
 * Se docs/CONTENT-RADAR.md.
 */

const MAX_FEED_ITEMS = 15;

export interface SourceFetchResult {
  sourceId: string;
  label: string;
  fetched: number;
  inserted: number;
  skipped: number;
  error?: string;
}

/** Henter On Poynts egne kategorinavn, så AI-en vet hva som allerede er dekket. */
export async function getOwnCategoryNames(): Promise<string[]> {
  const payload = await getPayload({ config });
  const cats = await payload.find({ collection: "categories", limit: 300 });
  return (cats.docs as Array<{ name?: string | null }>)
    .map((c) => c.name?.trim())
    .filter((n): n is string => Boolean(n));
}

/** Aktive kilder (eventuelt filtrert til én id ved on-demand-henting). */
export async function listActiveSources(
  sourceId?: string
): Promise<PlannerInspirationSource[]> {
  if (sourceId) {
    return db
      .select()
      .from(plannerInspirationSource)
      .where(eq(plannerInspirationSource.id, sourceId));
  }
  return db
    .select()
    .from(plannerInspirationSource)
    .where(eq(plannerInspirationSource.isActive, true));
}

/**
 * Delmengden av en kilde som hentingen faktisk trenger. Bevisst uten Date-felter
 * så den også aksepterer JSON-serialiserte kilder fra et Inngest `step.run`
 * (der Date blir string).
 */
export interface FetchableSource {
  id: string;
  label: string;
  url: string;
  type: "website" | "rss";
  personName: string | null;
}

interface RawFeedItem {
  title: string;
  url: string | null;
  summary: string | null;
  publishedAt: Date | null;
}

const stripTags = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function tag(block: string, name: string): string | null {
  const m = block.match(
    new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i")
  );
  return m ? stripTags(m[1]) : null;
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Minimal RSS 2.0 / Atom-parser uten avhengighet. Henter tittel, lenke,
 * sammendrag og dato fra hver sak. Robust nok for vanlige blogg-/nyhetsfeeds.
 */
function parseFeed(xml: string): RawFeedItem[] {
  const items: RawFeedItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi);
  if (!blocks) return items;

  for (const block of blocks.slice(0, MAX_FEED_ITEMS)) {
    const title = tag(block, "title") ?? "(uten tittel)";
    // RSS: <link>url</link>. Atom: <link href="url" />.
    let url = tag(block, "link");
    if (!url) {
      const href = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      url = href ? href[1] : null;
    }
    const summary =
      tag(block, "description") ??
      tag(block, "summary") ??
      tag(block, "content");
    const published = parseDate(
      block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ??
        block.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1] ??
        block.match(/<published>([\s\S]*?)<\/published>/i)?.[1] ??
        null
    );
    items.push({
      title,
      url,
      summary: summary ? summary.slice(0, 600) : null,
      publishedAt: published,
    });
  }
  return items;
}

/** Henter rå innhold fra en kilde, klart til destillering. */
async function fetchSourceContent(
  source: FetchableSource
): Promise<{ content: string; feedItems: RawFeedItem[] }> {
  if (source.type === "rss") {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "PoyntInnholdsradar/1.0" },
    });
    if (!res.ok) {
      throw new Error(`RSS-henting feilet (${res.status}) for ${source.url}`);
    }
    const xml = await res.text();
    const feedItems = parseFeed(xml);
    const content = feedItems
      .map(
        (it) =>
          `- ${it.title}${it.url ? ` (${it.url})` : ""}${it.summary ? `\n  ${it.summary}` : ""}`
      )
      .join("\n");
    return { content, feedItems };
  }

  // Nettside: scrape hovedinnholdet via Firecrawl.
  const markdown = await scrapeWebsite(source.url);
  return { content: markdown, feedItems: [] };
}

/**
 * Henter, destillerer og lagrer inspirasjon fra én kilde. Idempotent: dedup på
 * (kilde, url) når url finnes, ellers (kilde, tittel).
 */
export async function processSource(
  source: FetchableSource,
  ownCategories: string[]
): Promise<SourceFetchResult> {
  const base: SourceFetchResult = {
    sourceId: source.id,
    label: source.label,
    fetched: 0,
    inserted: 0,
    skipped: 0,
  };

  try {
    const { content } = await fetchSourceContent(source);
    if (!content.trim()) {
      await markFetched(source.id);
      return base;
    }

    const distilled = await distillInspiration({
      sourceLabel: source.personName
        ? `${source.label} (${source.personName})`
        : source.label,
      content,
      ownCategories,
    });
    base.fetched = distilled.items.length;

    // Eksisterende url-er/titler for denne kilden → dedup.
    const existing = await db
      .select({
        url: plannerInspirationItem.url,
        title: plannerInspirationItem.title,
      })
      .from(plannerInspirationItem)
      .where(eq(plannerInspirationItem.sourceId, source.id));
    const seenUrls = new Set(existing.map((e) => e.url).filter(Boolean));
    const seenTitles = new Set(existing.map((e) => e.title));

    for (const item of distilled.items) {
      const dupe = item.url
        ? seenUrls.has(item.url)
        : seenTitles.has(item.title);
      if (dupe) {
        base.skipped += 1;
        continue;
      }
      await db.insert(plannerInspirationItem).values({
        sourceId: source.id,
        title: item.title,
        url: item.url,
        summary: item.summary,
        topics: item.topics,
      });
      if (item.url) seenUrls.add(item.url);
      seenTitles.add(item.title);
      base.inserted += 1;
    }

    await markFetched(source.id);
    return base;
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
    return base;
  }
}

async function markFetched(sourceId: string) {
  await db
    .update(plannerInspirationSource)
    .set({ lastFetchedAt: new Date() })
    .where(eq(plannerInspirationSource.id, sourceId));
}

/** Antall lagrede inspirasjons-items per kilde (til admin-tabellen). */
export async function getItemCountBySource(): Promise<Record<string, number>> {
  const rows = await db
    .select({ sourceId: plannerInspirationItem.sourceId })
    .from(plannerInspirationItem);
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.sourceId] = (counts[r.sourceId] ?? 0) + 1;
  }
  return counts;
}
