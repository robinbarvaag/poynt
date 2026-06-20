/**
 * Migrerer blogginnlegg fra dagens poynt.no (Wix) inn i Payload.
 *
 * Kilder:
 *  - RSS-feed  https://www.poynt.no/blog-feed.xml  → tittel, utdrag, kategori,
 *    forfatter, dato og cover-bilde (enclosure) for alle innlegg.
 *  - Hver post-side (/post/<slug>) → full brødtekst, hentet på BLOKK-nivå fra
 *    Wix sin `data-hook="post-description"` (ekte <p>/<h2>/<h3>/<blockquote>/
 *    <ul><li>) → Lexical med avsnitt, overskrifter, lister og sitater.
 *
 * Hva som hentes inn pr. innlegg: cover-bilde lastes ned til Media, kategori(er)
 * opprettes/gjenbrukes, og innlegget opprettes publisert. Idempotent: finnes
 * innlegget (matchende slug) OPPDATERES kun brødteksten (bilde/kategori/dato
 * beholdes) — trygt å kjøre på nytt for å forbedre uttrekket. Fet/lenker/innfelte
 * bilder forenkles til tekst — finpuss i admin etterpå.
 *
 *   bun run --cwd apps/web payload run scripts/migrate-blog-from-wix.ts
 */
import config from "@payload-config";
import { XMLParser } from "fast-xml-parser";
import { getPayload } from "payload";
import { generateSlug } from "../lib/generate-slug";

const FEED_URL = "https://www.poynt.no/blog-feed.xml";
const UA = "Mozilla/5.0 (compatible; PoyntMigrate/1.0; +https://www.poynt.no)";

interface FeedItem {
  title: string;
  link: string;
  excerpt: string;
  categories: string[];
  creator?: string;
  pubDate?: string;
  coverUrl?: string;
}

type Block =
  | { type: "p" | "h2" | "h3" | "h4" | "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function toText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    "#text" in (value as Record<string, unknown>)
  )
    return String((value as Record<string, unknown>)["#text"]);
  return String(value);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, ""));
}

async function fetchFeed(): Promise<FeedItem[]> {
  const res = await fetch(FEED_URL, { headers: { "user-agent": UA } });
  const xml = await res.text();
  const data = parser.parse(xml);
  const rawItems = data?.rss?.channel?.item;
  const items: Record<string, unknown>[] = Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : [];

  return items.map((item) => {
    // Et innlegg kan ha flere <category> → array; ett → enkeltverdi.
    const rawCats = Array.isArray(item.category)
      ? item.category
      : item.category
        ? [item.category]
        : [];
    return {
      title: decodeEntities(toText(item.title)),
      link: toText(item.link),
      excerpt: decodeEntities(toText(item.description)),
      categories: rawCats.map((c) => decodeEntities(toText(c))).filter(Boolean),
      creator: item["dc:creator"]
        ? decodeEntities(toText(item["dc:creator"]))
        : undefined,
      pubDate: item.pubDate ? toText(item.pubDate) : undefined,
      coverUrl: (item.enclosure as Record<string, string>)?.["@_url"],
    };
  });
}

/**
 * Henter post-siden og trekker ut brødteksten på BLOKK-nivå. Wix legger artikkel-
 * innholdet i `data-hook="post-description"` med ordentlige semantiske tagger
 * (<p>/<h2>/<h3>/<blockquote>/<ul><li>). Vi avgrenser til den containeren (så vi
 * slipper nav/footer/relaterte), tar blokkene i dokument-rekkefølge og slår
 * sammen spennene inne i hver blokk → hele setninger (ingen fragmenter), ekte
 * overskrifter, lister og sitater. Fet/lenker/innfelte bilder forenkles til tekst.
 */
async function fetchBody(link: string, ownTitle: string): Promise<Block[]> {
  let html: string;
  try {
    const res = await fetch(link, { headers: { "user-agent": UA } });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  // Avgrens til artikkel-containeren.
  const start = html.indexOf('data-hook="post-description"');
  if (start === -1) return [];
  const end = html.indexOf('data-hook="post-footer"', start);
  const region = html.slice(start, end === -1 ? undefined : end);

  const blocks: Block[] = [];
  const seen = new Set<string>();
  for (const m of region.matchAll(
    /<(h2|h3|h4|p|blockquote|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/g
  )) {
    const tag = m[1];
    const inner = m[2];

    if (tag === "ul" || tag === "ol") {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
        .map((li) => stripTags(li[1]))
        .filter(Boolean);
      const key = `list:${items.join("|")}`;
      if (items.length && !seen.has(key)) {
        seen.add(key);
        blocks.push({ type: "list", ordered: tag === "ol", items });
      }
      continue;
    }

    const text = stripTags(inner);
    if (!text || text === ownTitle || seen.has(text)) continue;
    seen.add(text);
    const type =
      tag === "blockquote" ? "quote" : (tag as "p" | "h2" | "h3" | "h4");
    blocks.push({ type, text });
  }

  return blocks;
}

function textNode(text: string) {
  return {
    type: "text",
    mode: "normal" as const,
    text,
    detail: 0,
    format: 0,
    style: "",
    version: 1,
  };
}

const BASE = {
  format: "" as const,
  indent: 0,
  version: 1,
  direction: "ltr" as const,
};

function blockToNode(b: Block) {
  if (b.type === "list") {
    return {
      type: "list",
      listType: b.ordered ? "number" : "bullet",
      tag: b.ordered ? "ol" : "ul",
      start: 1,
      ...BASE,
      children: b.items.map((text, i) => ({
        type: "listitem",
        value: i + 1,
        ...BASE,
        children: [textNode(text)],
      })),
    };
  }
  if (b.type === "h2" || b.type === "h3" || b.type === "h4") {
    return {
      type: "heading",
      tag: b.type,
      ...BASE,
      children: [textNode(b.text)],
    };
  }
  if (b.type === "quote") {
    return { type: "quote", ...BASE, children: [textNode(b.text)] };
  }
  return {
    type: "paragraph",
    textFormat: 0,
    ...BASE,
    children: [textNode(b.text)],
  };
}

function buildLexical(blocks: Block[]) {
  return {
    root: {
      type: "root",
      ...BASE,
      children: blocks.map(blockToNode),
    },
  };
}

const payload = await getPayload({ config });

async function findOrCreateCategory(name: string): Promise<number> {
  const slug = generateSlug(name);
  const existing = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing.docs[0]) return existing.docs[0].id;
  const created = await payload.create({
    collection: "categories",
    data: { name, slug },
  });
  return created.id;
}

async function downloadCover(
  url: string,
  slug: string,
  alt: string
): Promise<number | undefined> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) return undefined;
    const mimetype =
      res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    const ext = mimetype.includes("png")
      ? "png"
      : mimetype.includes("webp")
        ? "webp"
        : "jpg";
    const buffer = Buffer.from(await res.arrayBuffer());
    const media = await payload.create({
      collection: "media",
      data: { alt },
      file: {
        data: buffer,
        mimetype,
        name: `${slug}.${ext}`,
        size: buffer.length,
      },
    });
    return media.id;
  } catch {
    return undefined;
  }
}

async function main() {
  const items = await fetchFeed();
  console.log(`Fant ${items.length} innlegg i feeden.\n`);

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const slug = generateSlug(item.title);

    const blocks = await fetchBody(item.link, item.title);
    const content = buildLexical(
      blocks.length ? blocks : [{ type: "p", text: item.excerpt }]
    );

    // Finnes innlegget? Da oppdaterer vi bare brødteksten (beholder bilde/
    // kategori/dato) — trygt å kjøre på nytt for å forbedre uttrekket.
    const existing = await payload.find({
      collection: "blog-posts",
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: "blog-posts",
        id: existing.docs[0].id,
        data: { content },
      });
      console.log(
        `♻️  Oppdatert brødtekst: ${item.title} (${blocks.length} blokker)`
      );
      updated += 1;
      continue;
    }

    const coverId = item.coverUrl
      ? await downloadCover(item.coverUrl, slug, item.title)
      : undefined;

    const categoryIds: number[] = [];
    for (const name of item.categories) {
      categoryIds.push(await findOrCreateCategory(name));
    }

    await payload.create({
      collection: "blog-posts",
      data: {
        title: item.title,
        slug,
        excerpt: item.excerpt || undefined,
        content,
        ...(coverId ? { featuredImage: coverId } : {}),
        ...(categoryIds.length ? { categories: categoryIds } : {}),
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        _status: "published",
      },
    });

    console.log(
      `✅ ${item.title}  (${blocks.length} blokker, ${coverId ? "cover ✓" : "uten cover"}${item.categories.length ? `, ${item.categories.join(", ")}` : ""})`
    );
    created += 1;
  }

  console.log(`\nFerdig. Opprettet ${created}, oppdatert ${updated}.`);
  process.exit(0);
}

await main();
