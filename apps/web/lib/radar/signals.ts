import config from "@payload-config";
import { count, db, gte } from "@poynt/planner-db";
import { plannerToolResult } from "@poynt/planner-db/schema";
import { type RadarSignalInput, toolIdLabels } from "@poynt/planner-validators";
import { getPayload } from "payload";

/**
 * Innholdsradar — signal-innsamling. Regner ut DETERMINISTISKE fakta om On
 * Poynts innholdsbibliotek (alder, fastlåste utkast, kategori-dekning, fremhevet-
 * rotasjon) + etterspørsel fra medlemmenes verktøybruk. AI-en formulerer
 * forslagene; denne filen eier tallene. Se docs/CONTENT-RADAR.md.
 */

type ContentSlug =
  | "articles"
  | "courses"
  | "guides"
  | "blog-posts"
  | "podcasts";

interface CollectionConfig {
  slug: ContentSlug;
  label: string;
  hasDrafts: boolean;
  /** Hvilket felt som holder kategori-relasjonen. */
  catField: "categories" | "category";
}

const CONTENT_COLLECTIONS: CollectionConfig[] = [
  {
    slug: "articles",
    label: "Artikkel",
    hasDrafts: true,
    catField: "categories",
  },
  { slug: "courses", label: "Kurs", hasDrafts: true, catField: "categories" },
  { slug: "guides", label: "Guide", hasDrafts: true, catField: "category" },
  {
    slug: "blog-posts",
    label: "Blogginnlegg",
    hasDrafts: true,
    catField: "categories",
  },
  {
    slug: "podcasts",
    label: "Podkast",
    hasDrafts: false,
    catField: "categories",
  },
];

// Terskler
const STALE_MONTHS = 6;
const FEATURED_STALE_MONTHS = 3;
const DRAFT_STUCK_DAYS = 30;
const DEMAND_DAYS = 90;

// Tak per signaltype (token-budsjett)
const MAX_STALE = 12;
const MAX_DRAFTS = 8;
const MAX_FEATURED = 5;

interface RadarDoc {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  updatedAt: string;
  _status?: string | null;
  isFeatured?: boolean | null;
  categories?: unknown;
  category?: unknown;
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

  // Kategori-gap (lite/ingen dekning)
  for (const entry of catCount.values()) {
    if (entry.count <= 1) {
      signals.push({
        key: `coverage:${entry.slug}`,
        kind: "coverage_gap",
        summary:
          entry.count === 0
            ? `Kategorien «${entry.name}» har ingen publiserte saker ennå.`
            : `Kategorien «${entry.name}» har bare 1 publisert sak.`,
        priority: entry.count === 0 ? 70 : 55,
        targetCollection: null,
        targetId: null,
        category: entry.slug,
      });
    }
  }

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
      summary: `Medlemmene har brukt «${label}» ${row.n} ganger de siste ${DEMAND_DAYS} dagene — sterkt hint om hva de strever med og trenger innhold om.`,
      priority: clamp(50 + row.n * 3, 50, 90),
      targetCollection: null,
      targetId: null,
      category: null,
    });
  }

  return signals;
}
