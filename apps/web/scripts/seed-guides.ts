/**
 * Seeder Guider-kolleksjonen fra de OCR-transkriberte Notion-sidene i
 * scripts/guide-content/*.json. Idempotent: upsert på slug, så det er trygt å
 * kjøre om igjen. Bygger Lexical fra blokkene, oppretter kategorier med
 * merkevarefarger og kobler innholdsblokkene til Payload-blokkene.
 *
 * Bilder fra Notion lot seg ikke hente ut (lå innbakt i skjermbildene), så
 * bilde-/galleri-/kolonneblokker seedes UTEN bilde — frontend viser en pen
 * «bilde kommer»-rute med beskrivelsen, klar til at redaktøren bytter den ut.
 * Toggles var kollapset i kilden, så kun titlene finnes.
 *
 *   bun run --cwd apps/web payload run scripts/seed-guides.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "@payload-config";
import { type RequiredDataFromCollectionSlug, getPayload } from "payload";
import { generateSlug } from "../lib/generate-slug";

type GuideData = RequiredDataFromCollectionSlug<"guides">;

// ---------- Lexical-byggere ----------

type RichBlock =
  | string
  | { heading: string; level?: 2 | 3 }
  | { list: string[] }
  | { quote: string };

const textNode = (text: string) => ({
  type: "text",
  mode: "normal" as const,
  text,
  detail: 0,
  format: 0,
  style: "",
  version: 1,
});

const paragraphNode = (text: string) => ({
  type: "paragraph",
  format: "" as const,
  indent: 0,
  version: 1,
  direction: "ltr" as const,
  textFormat: 0,
  children: [textNode(text)],
});

function buildLexical(blocks: RichBlock[] | undefined) {
  const children = (blocks ?? []).map((block) => {
    if (typeof block === "string") return paragraphNode(block);
    if ("heading" in block) {
      return {
        type: "heading",
        tag: `h${block.level ?? 2}` as const,
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: [textNode(block.heading)],
      };
    }
    if ("quote" in block) {
      return {
        type: "quote",
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: [textNode(block.quote)],
      };
    }
    return {
      type: "list",
      listType: "bullet" as const,
      tag: "ul" as const,
      start: 1,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: block.list.map((item, index) => ({
        type: "listitem",
        value: index + 1,
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: [textNode(item)],
      })),
    };
  });

  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: children.length > 0 ? children : [paragraphNode("")],
    },
  };
}

// ---------- Kategori-presets (farge + ikon + slug) ----------

const CATEGORY_PRESETS: Record<string, { color: string; icon: string }> = {
  Instagram: { color: "#E1306C", icon: "📸" },
  LinkedIn: { color: "#0A66C2", icon: "💼" },
  Facebook: { color: "#1877F2", icon: "👍" },
  YouTube: { color: "#FF0000", icon: "▶️" },
  Pinterest: { color: "#E60023", icon: "📌" },
  Canva: { color: "#00C4CC", icon: "🎨" },
  AI: { color: "#6C5CE7", icon: "🤖" },
  Keywords: { color: "#16A085", icon: "🔑" },
  Kommunikasjon: { color: "#E67E22", icon: "📣" },
  Apper: { color: "#2D9CDB", icon: "📱" },
  Innholdsplanlegger: { color: "#8E44AD", icon: "📅" },
  "Til gründere": { color: "#E84393", icon: "🚀" },
};

// ---------- Per-side overstyringer (tittel/seksjon/rekkefølge) ----------

type Section = "generelt" | "kanaler" | "maler" | "inspirasjon" | "ressurser";

const OVERRIDES: Record<
  string,
  { title?: string; section?: Section; order?: number; featured?: boolean }
> = {
  forside: {
    title: "Kom i gang på On Poynt",
    section: "generelt",
    order: -10,
    featured: true,
  },
  instagram: { order: 1 },
  linkedin: { order: 2 },
  facebook: { order: 3 },
  pinterest: { order: 4 },
  youtube: { order: 5 },
  "canva-tips": { order: 6 },
  ai: { order: 1 },
  kommunikasjon: { order: 2 },
  keywords: { order: 3 },
  "apper-som-anbefales": { order: 4 },
  "til-grundere": { order: 5 },
  innholdsplanlegger: { order: 1 },
  inspirasjon: { order: 1 },
};

// ---------- JSON-typer (løst typet, fra OCR) ----------

interface JsonColumn {
  type?: "text" | "image";
  blocks?: RichBlock[];
  caption?: string | null;
  placeholder?: string | null;
}
interface JsonContentBlock {
  type: string;
  // richText / callout
  blocks?: RichBlock[];
  tone?: string;
  icon?: string;
  // columns
  align?: "top" | "center";
  columns?: JsonColumn[];
  // gallery
  layout?: "grid" | "carousel";
  items?: Array<Record<string, unknown>>;
  caption?: string | null;
  // video
  url?: string | null;
  // image
  width?: "normal" | "wide" | "full";
  placeholder?: string | null;
}
interface JsonGuide {
  slug: string;
  title: string;
  icon?: string | null;
  section: string;
  category?: string | null;
  lede?: string | null;
  content: JsonContentBlock[];
}

const VALID_TONES = new Set(["mint", "saffron", "salmon", "primary", "ink"]);
const VALID_KINDS = new Set(["pdf", "canva", "link", "other"]);

function mapContent(json: JsonGuide): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];

  for (const b of json.content) {
    switch (b.type) {
      case "richText":
        out.push({
          blockType: "guideRichText",
          content: buildLexical(b.blocks),
        });
        break;

      case "callout":
        out.push({
          blockType: "guideCallout",
          tone: b.tone && VALID_TONES.has(b.tone) ? b.tone : "mint",
          icon: b.icon ?? null,
          content: buildLexical(b.blocks),
        });
        break;

      case "columns":
        out.push({
          blockType: "guideColumns",
          align: b.align ?? "top",
          columns: (b.columns ?? []).map((c) =>
            c.type === "image"
              ? {
                  type: "image",
                  image: null,
                  caption: c.caption ?? c.placeholder ?? null,
                }
              : { type: "text", content: buildLexical(c.blocks) }
          ),
        });
        break;

      case "gallery":
        out.push({
          blockType: "guideGallery",
          layout: b.layout ?? "grid",
          caption: b.caption ?? null,
          images: (b.items ?? []).map((it) => ({
            image: null,
            caption:
              (it.placeholder as string) ?? (it.caption as string) ?? null,
          })),
        });
        break;

      case "image":
        out.push({
          blockType: "guideImage",
          image: null,
          width: b.width ?? "normal",
          caption: b.caption ?? b.placeholder ?? null,
        });
        break;

      case "video":
        if (b.url) {
          out.push({
            blockType: "guideVideo",
            url: b.url,
            caption: b.caption ?? null,
          });
        } else {
          // Ingen synlig URL i kilden → behold som notat så ingenting går tapt.
          out.push({
            blockType: "guideRichText",
            content: buildLexical([
              `🎬 Video: ${b.caption ?? "legg til videolenke"}`,
            ]),
          });
        }
        break;

      case "toggle":
        out.push({
          blockType: "guideToggle",
          items: (b.items ?? []).map((it) => ({
            title: (it.title as string) ?? "Punkt",
            content: it.blocks
              ? buildLexical(it.blocks as RichBlock[])
              : undefined,
          })),
        });
        break;

      case "bookmark":
        out.push({
          blockType: "guideBookmark",
          items: (b.items ?? []).map((it) => ({
            url: (it.url as string) ?? null,
            title: (it.title as string) ?? null,
            description: (it.description as string) ?? null,
          })),
        });
        break;

      case "download":
        out.push({
          blockType: "guideDownload",
          items: (b.items ?? []).map((it) => {
            const kind = (it.kind as string) ?? "pdf";
            return {
              title: (it.title as string) ?? "Ressurs",
              description: (it.description as string) ?? null,
              kind: VALID_KINDS.has(kind) ? kind : "other",
              url: (it.url as string) ?? null,
            };
          }),
        });
        break;

      case "divider":
        out.push({
          blockType: "guideDivider",
          label: (b as { label?: string }).label ?? null,
        });
        break;

      default:
        break;
    }
  }

  return out;
}

// ---------- Hovedkjøring ----------

const payload = await getPayload({ config });

const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "guide-content"
);
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

// Cache for kategori-oppslag (navn → id)
const categoryCache = new Map<string, number>();

async function upsertCategory(name: string): Promise<number> {
  const slug = generateSlug(name);
  const cached = categoryCache.get(slug);
  if (cached) return cached;

  const existing = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    categoryCache.set(slug, existing.docs[0].id);
    return existing.docs[0].id;
  }

  const preset = CATEGORY_PRESETS[name];
  const created = await payload.create({
    collection: "categories",
    data: {
      name,
      slug,
      color: preset?.color,
      icon: preset?.icon,
    },
  });
  categoryCache.set(slug, created.id);
  return created.id;
}

let created = 0;
let updated = 0;

for (const file of files) {
  const json = JSON.parse(
    readFileSync(path.join(dir, file), "utf8")
  ) as JsonGuide;
  const override = OVERRIDES[json.slug] ?? {};

  const section = (override.section ??
    (json.section === "forside" ? "generelt" : json.section)) as Section;

  const categoryId = json.category
    ? await upsertCategory(json.category)
    : undefined;

  const data: GuideData = {
    title: override.title ?? json.title,
    slug: json.slug,
    icon: json.icon ?? null,
    lede: json.lede ?? null,
    section,
    order: override.order ?? 0,
    isFeatured: override.featured ?? false,
    category: categoryId,
    content: mapContent(json) as unknown as GuideData["content"],
    _status: "published",
  };

  const existing = await payload.find({
    collection: "guides",
    where: { slug: { equals: json.slug } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    await payload.update({
      collection: "guides",
      id: existing.docs[0].id,
      data,
    });
    updated++;
    payload.logger.info(`Oppdaterte guide: ${data.title}`);
  } else {
    await payload.create({ collection: "guides", data });
    created++;
    payload.logger.info(`Opprettet guide: ${data.title}`);
  }
}

payload.logger.info(
  `Ferdig. ${created} opprettet, ${updated} oppdatert (${files.length} filer).`
);

process.exit(0);
