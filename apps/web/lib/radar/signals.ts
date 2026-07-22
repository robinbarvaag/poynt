import type { Guide } from "@/payload-types";
import config from "@payload-config";
import { count, db, desc, gte } from "@poynt/planner-db";
import {
  plannerInspirationItem,
  plannerToolResult,
} from "@poynt/planner-db/schema";
import { type RadarSignalInput, toolIdLabels } from "@poynt/planner-validators";
import { getPayload } from "payload";
import {
  hashGuideContent,
  serializeGuideContent,
} from "../serialize-guide-content";
import { getViewAggregates } from "./views";

/**
 * Innholdsradar — signal-innsamling. Regner ut DETERMINISTISKE fakta om On
 * Poynts innholdsbibliotek (alder, fastlåste utkast, kategori-dekning, fremhevet-
 * rotasjon) + etterspørsel fra medlemmenes verktøybruk. AI-en formulerer
 * forslagene; denne filen eier tallene. Se docs/CONTENT-RADAR.md.
 */

type ContentSlug = "courses" | "guides" | "blog-posts";

interface CollectionConfig {
  slug: ContentSlug;
  label: string;
  hasDrafts: boolean;
  /** Hvilket felt som holder kategori-relasjonen. */
  catField: "categories" | "category";
}

const CONTENT_COLLECTIONS: CollectionConfig[] = [
  { slug: "courses", label: "Kurs", hasDrafts: true, catField: "categories" },
  { slug: "guides", label: "Guide", hasDrafts: true, catField: "category" },
  {
    slug: "blog-posts",
    label: "Blogginnlegg",
    hasDrafts: true,
    catField: "categories",
  },
];

// Terskler
const STALE_MONTHS = 6;
const FEATURED_STALE_MONTHS = 3;
const DRAFT_STUCK_DAYS = 30;
const DEMAND_DAYS = 90;
// Guider med AI-kvalitetsscore under dette regnes som forbedringsverdige.
const LOW_QUALITY_MAX = 55;

// Tak per signaltype (token-budsjett + støydemping)
const MAX_STALE = 12;
const MAX_DRAFTS = 8;
const MAX_FEATURED = 5;
const MAX_COVERAGE = 6;
const MAX_INSPIRATION = 5;
const MAX_INSPIRATION_ITEMS = 200;
const MAX_POPULAR = 6;
const MAX_LOW_QUALITY = 8;
// Visningsvindu + minste antall visninger før noe regnes som «mye lest».
const POPULAR_DAYS = 60;
const MIN_VIEWS = 10;

interface RadarDoc {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  updatedAt: string;
  _status?: string | null;
  isFeatured?: boolean | null;
  categories?: unknown;
  category?: unknown;
  qualityScore?: number | null;
  qualityReview?: { contentHash?: string } | null;
}

interface CatRef {
  id: number | string;
  slug?: string;
  name?: string;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(n)));

const monthsSince = (iso: string) =>
  (Date.now() - new Date(iso).getTime()) / (30 * 24 * 3600 * 1000);

/** Normaliserer et tema/kategorinavn for løs sammenligning. */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9æøå\s]/g, "")
    .trim();

function extractCats(
  doc: RadarDoc,
  field: "categories" | "category"
): CatRef[] {
  const rel = field === "categories" ? doc.categories : doc.category;
  if (!rel) return [];
  const arr = Array.isArray(rel) ? rel : [rel];
  return arr
    .filter(
      (c): c is Record<string, unknown> => Boolean(c) && typeof c === "object"
    )
    .map((c) => ({
      id: c.id as number | string,
      slug: typeof c.slug === "string" ? c.slug : undefined,
      name: typeof c.name === "string" ? c.name : undefined,
    }));
}

/**
 * Samler alle signaler. Returnerer en flat liste klar til AI-syntese.
 * Trygt å kjøre i en Inngest-step: returverdien er ren JSON.
 */
export async function gatherSignals(): Promise<RadarSignalInput[]> {
  const payload = await getPayload({ config });
  const signals: RadarSignalInput[] = [];

  // Kategori-dekning: start på 0 for ALLE kategorier, tell opp underveis.
  const catCount = new Map<
    string,
    { count: number; slug: string; name: string }
  >();
  const allCats = await payload.find({ collection: "categories", limit: 300 });
  for (const c of allCats.docs as unknown as CatRef[]) {
    if (c.slug) {
      catCount.set(c.slug, {
        count: 0,
        slug: c.slug,
        name: c.name ?? c.slug,
      });
    }
  }

  const staleCandidates: RadarSignalInput[] = [];
  const featuredCandidates: RadarSignalInput[] = [];
  const draftCandidates: RadarSignalInput[] = [];
  const lowQualityCandidates: RadarSignalInput[] = [];

  // Metadata om publisert innhold, slått opp av visnings-analysen (Fase 4) for
  // å avgjøre om et mye lest innlegg bør oppdateres (gammelt) eller promoteres.
  const docMeta = new Map<
    string,
    { title: string; label: string; months: number; isFeatured: boolean }
  >();

  for (const col of CONTENT_COLLECTIONS) {
    // Publisert innhold → alder, fremhevet-rotasjon, kategori-dekning.
    const published = await payload.find({
      collection: col.slug,
      where: col.hasDrafts ? { _status: { equals: "published" } } : {},
      sort: "updatedAt",
      depth: 1,
      limit: 300,
    });

    for (const doc of published.docs as unknown as RadarDoc[]) {
      const months = monthsSince(doc.updatedAt);
      const title = doc.title ?? `${col.label} #${doc.id}`;
      const cats = extractCats(doc, col.catField);

      docMeta.set(`${col.slug}:${doc.id}`, {
        title,
        label: col.label,
        months,
        isFeatured: Boolean(doc.isFeatured),
      });

      // Kategori-dekning
      for (const c of cats) {
        if (c.slug && catCount.has(c.slug)) {
          const entry = catCount.get(c.slug);
          if (entry) entry.count += 1;
        }
      }

      // Foreldet innhold
      if (months >= STALE_MONTHS) {
        staleCandidates.push({
          key: `stale:${col.slug}:${doc.id}`,
          kind: "stale",
          summary: `«${title}» (${col.label}) er ikke oppdatert på ${Math.round(months)} måneder.`,
          priority: clamp(40 + (months - STALE_MONTHS) * 4, 40, 85),
          targetCollection: col.slug,
          targetId: String(doc.id),
          category: cats[0]?.slug ?? null,
        });
      }

      // Fremhevet innhold som har ligget lenge → bør roteres
      if (doc.isFeatured && months >= FEATURED_STALE_MONTHS) {
        featuredCandidates.push({
          key: `featured:${col.slug}:${doc.id}`,
          kind: "featured_rotation",
          summary: `«${title}» (${col.label}) har vært fremhevet i ${Math.round(months)} måneder — vurder å rotere inn noe nytt eller løfte noe annet.`,
          priority: clamp(50 + (months - FEATURED_STALE_MONTHS) * 3, 50, 75),
          targetCollection: col.slug,
          targetId: String(doc.id),
          category: cats[0]?.slug ?? null,
        });
      }

      // Lav AI-kvalitetsscore (kun guider, som har vurderings-feltene). Vi
      // stoler bare på scoren hvis den ble satt mot DAGENS innhold – derfor
      // sammenligner vi lagret innholds-hash mot en fersk hash. Endret innhold
      // → utdatert score → hopp over (ingen falske signaler).
      if (
        col.slug === "guides" &&
        typeof doc.qualityScore === "number" &&
        doc.qualityScore < LOW_QUALITY_MAX
      ) {
        const currentHash = hashGuideContent(
          serializeGuideContent(doc as unknown as Guide)
        );
        if (doc.qualityReview?.contentHash === currentHash) {
          lowQualityCandidates.push({
            key: `low_quality:${col.slug}:${doc.id}`,
            kind: "low_quality",
            summary: `«${title}» (${col.label}) fikk kvalitetsscore ${doc.qualityScore}/100 i AI-vurderingen — under terskelen, så den bør skrives om eller styrkes.`,
            priority: clamp(50 + (LOW_QUALITY_MAX - doc.qualityScore), 50, 90),
            targetCollection: col.slug,
            targetId: String(doc.id),
            category: cats[0]?.slug ?? null,
          });
        }
      }
    }

    // Fastlåste utkast
    if (col.hasDrafts) {
      const drafts = await payload.find({
        collection: col.slug,
        where: { _status: { equals: "draft" } },
        sort: "updatedAt",
        depth: 0,
        limit: 50,
      });
      for (const doc of drafts.docs as unknown as RadarDoc[]) {
        const days = monthsSince(doc.updatedAt) * 30;
        if (days < DRAFT_STUCK_DAYS) continue;
        const title = doc.title ?? `${col.label} #${doc.id}`;
        draftCandidates.push({
          key: `stuck_draft:${col.slug}:${doc.id}`,
          kind: "stuck_draft",
          summary: `Utkastet «${title}» (${col.label}) har stått urørt i ${Math.round(days)} dager — fullfør og publiser, eller forkast.`,
          priority: clamp(55 + (days - DRAFT_STUCK_DAYS) / 7, 55, 80),
          targetCollection: col.slug,
          targetId: String(doc.id),
          category: null,
        });
      }
    }
  }

  // Behold de mest presserende per type.
  const byPriority = (a: RadarSignalInput, b: RadarSignalInput) =>
    b.priority - a.priority;
  signals.push(...staleCandidates.sort(byPriority).slice(0, MAX_STALE));
  signals.push(...draftCandidates.sort(byPriority).slice(0, MAX_DRAFTS));
  signals.push(...featuredCandidates.sort(byPriority).slice(0, MAX_FEATURED));
  signals.push(
    ...lowQualityCandidates.sort(byPriority).slice(0, MAX_LOW_QUALITY)
  );

  // Kategori-gap (lite/ingen dekning). Tomme kategorier veier tyngst, og vi
  // beholder bare de mest presserende så lista ikke fylles av nesten like
  // «har bare 1 sak»-forslag.
  const coverageCandidates: RadarSignalInput[] = [];
  for (const entry of catCount.values()) {
    if (entry.count <= 1) {
      coverageCandidates.push({
        key: `coverage:${entry.slug}`,
        kind: "coverage_gap",
        summary:
          entry.count === 0
            ? `Kategorien «${entry.name}» har ingen publiserte saker ennå — et helt udekket tema.`
            : `Kategorien «${entry.name}» har bare 1 publisert sak — tynn dekning hvis medlemmene leter her.`,
        priority: entry.count === 0 ? 70 : 55,
        targetCollection: null,
        targetId: null,
        category: entry.slug,
      });
    }
  }
  signals.push(...coverageCandidates.sort(byPriority).slice(0, MAX_COVERAGE));

  // Etterspørsel: medlemmenes verktøybruk siste 90 dager.
  const since = new Date(Date.now() - DEMAND_DAYS * 24 * 3600 * 1000);
  const toolUsage = await db
    .select({ toolId: plannerToolResult.toolId, n: count() })
    .from(plannerToolResult)
    .where(gte(plannerToolResult.createdAt, since))
    .groupBy(plannerToolResult.toolId);

  for (const row of toolUsage) {
    if (row.n < 2) continue; // for lite til å være et signal
    const label =
      (toolIdLabels as Record<string, string>)[row.toolId] ?? row.toolId;
    signals.push({
      key: `demand:${row.toolId}`,
      kind: "demand",
      summary: `Medlemmene har brukt verktøyet «${label}» ${row.n} ganger de siste ${DEMAND_DAYS} dagene — et dokumentert behov for innhold om dette temaet.`,
      priority: clamp(50 + row.n * 3, 50, 90),
      targetCollection: null,
      targetId: null,
      category: null,
    });
  }

  // Inspirasjons-gap: eksterne temaer (fra registrerte kilder) som On Poynt
  // ennå ikke dekker. Et tema regnes som dekket hvis det løst matcher en av
  // våre egne kategorier. Krever ≥2 eksterne treff for å være et signal.
  signals.push(...(await inspirationGapSignals(catCount)));

  // Mye lest (Fase 4): faktiske visninger gjør «promoter/gjenbruk/oppdater»
  // datadrevet i stedet for proxy-basert. Tomt før visninger akkumuleres.
  signals.push(...(await popularSignals(docMeta)));

  return signals;
}

/**
 * Lager `popular`-signaler fra faktiske visninger siste {@link POPULAR_DAYS}
 * dager. Mye lest + gammelt → hint om oppdatering; mye lest + ferskt → hint om
 * å promotere/gjenbruke. AI-en velger endelig type.
 */
async function popularSignals(
  docMeta: Map<
    string,
    { title: string; label: string; months: number; isFeatured: boolean }
  >
): Promise<RadarSignalInput[]> {
  const aggregates = await getViewAggregates(POPULAR_DAYS);

  return aggregates
    .filter((a) => a.views >= MIN_VIEWS)
    .sort((a, b) => b.views - a.views)
    .slice(0, MAX_POPULAR)
    .map((a) => {
      const meta = docMeta.get(`${a.collection}:${a.contentId}`);
      const label = meta?.title ?? a.slug ?? `${a.collection} #${a.contentId}`;
      const where = meta?.label ?? a.collection;
      const isStale = (meta?.months ?? 0) >= STALE_MONTHS;
      const tail = isStale
        ? ` og er ikke oppdatert på ${Math.round(meta?.months ?? 0)} måneder — vurder en oppdatering så den fortsatt holder mål.`
        : " — et naturlig valg å løfte fram igjen eller gjenbruke i et nytt format/kanal.";
      return {
        key: `popular:${a.collection}:${a.contentId}`,
        kind: "popular" as const,
        summary: `«${label}» (${where}) er lest ${a.views} ganger de siste ${POPULAR_DAYS} dagene${tail}`,
        priority: clamp(55 + Math.round(a.views / 2), 55, 92),
        targetCollection: a.collection,
        targetId: a.contentId,
        category: null,
      };
    });
}

/**
 * Sammenligner destillerte eksterne temaer mot interne kategorier og lager
 * `inspiration_gap`-signaler for det vi ikke dekker ennå.
 */
async function inspirationGapSignals(
  catCount: Map<string, { count: number; slug: string; name: string }>
): Promise<RadarSignalInput[]> {
  const items = await db
    .select({
      title: plannerInspirationItem.title,
      topics: plannerInspirationItem.topics,
    })
    .from(plannerInspirationItem)
    .orderBy(desc(plannerInspirationItem.createdAt))
    .limit(MAX_INSPIRATION_ITEMS);

  if (items.length === 0) return [];

  // Intern dekning: normaliserte kategorinavn + slugs.
  const covered: string[] = [];
  for (const c of catCount.values()) {
    covered.push(normalize(c.name), normalize(c.slug.replace(/-/g, " ")));
  }
  const isCovered = (topic: string) => {
    const t = normalize(topic);
    if (!t) return true; // tomt tema teller ikke som gap
    return covered.some(
      (c) => c.length > 2 && (c.includes(t) || t.includes(c))
    );
  };

  // Grupper udekkede temaer: antall treff + et eksempel.
  const gaps = new Map<
    string,
    { topic: string; count: number; example: string }
  >();
  for (const item of items) {
    const topics = Array.isArray(item.topics) ? item.topics : [];
    for (const topic of topics) {
      if (typeof topic !== "string" || isCovered(topic)) continue;
      const key = normalize(topic);
      if (!key) continue;
      const entry = gaps.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        gaps.set(key, { topic, count: 1, example: item.title });
      }
    }
  }

  return [...gaps.values()]
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_INSPIRATION)
    .map((g) => ({
      key: `inspiration:${normalize(g.topic).replace(/\s+/g, "-")}`,
      kind: "inspiration_gap" as const,
      summary: `${g.count} eksterne kilder skriver om «${g.topic}» — et tema On Poynt ikke dekker ennå (f.eks. «${g.example}»).`,
      priority: clamp(45 + g.count * 5, 45, 70),
      targetCollection: null,
      targetId: null,
      category: null,
    }));
}
