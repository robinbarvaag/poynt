import {
  type BlockSchema,
  type FieldSchema,
  getBlockSchemas,
} from "@/lib/mcp/block-schema";
import { getPublicPath } from "@/lib/public-path";
import { lexicalToMarkdown } from "@/lib/serialize-guide-content";

/**
 * Blokk-layout (Payload) → lesbar markdown for AI-agenter. Drives av de samme
 * blokk-skjemaene som MCP-serveren, så en ny blokk får markdown automatisk:
 * tekstfelt blir avsnitt, tittel-felt blir overskrifter, array-rader blir
 * underseksjoner eller punktlister, CTA-er blir lenker og relasjoner blir
 * lenker til dokumentets side. Rene visningsvalg (select, checkbox, bilder)
 * hoppes over — de er støy for en språkmodell.
 */

type Rec = Record<string, unknown>;

export interface MarkdownContext {
  /** Absolutt base-URL, f.eks. `https://poynt.no`. */
  siteUrl: string;
}

/** Felt som gir overskrift for blokken/raden (første som har verdi vinner). */
const HEADING_FIELDS = ["title", "heading", "name", "question"];

/** Tekstfelt som er visuell pynt eller skjema-UI, ikke innhold. */
const DECORATIVE_TEXT_FIELDS = new Set([
  "eyebrow",
  "badge",
  "icon",
  "tagsLabel",
  "rotatorEyebrow",
  "rotatorMarkers",
  "embedUrl",
  "source",
  "prefix",
  "suffix",
  "buttonText",
  "placeholder",
  "doneLabel",
  "alt",
]);

const TEXT_TYPES = new Set(["text", "textarea", "email", "number"]);

/** Sitat-tilskrivelse: hvem sa det, og i hvilken rolle. */
const QUOTE_AUTHOR_FIELDS = ["author", "name"];
const QUOTE_DETAIL_FIELDS = ["role", "detail", "company"];

/** Etikett-felt for en lenke, i prioritert rekkefølge. */
const LINK_LABEL_FIELDS = [
  "linkLabel",
  "linkText",
  "ctaLabel",
  "ctaText",
  "label",
  "text",
];

/** Lengre «etiketter» er brødtekst (f.eks. et utdrag), ikke lenketekst. */
const MAX_LINK_LABEL_LENGTH = 80;

function isRec(value: unknown): value is Rec {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown): string {
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value.trim() : "";
}

/** `*` brukes som aksent-stjerne i titler («Lær raskere*») — fjernes. */
function cleanHeading(text: string): string {
  return text.replace(/\*/g, "").replace(/\s+/g, " ").trim();
}

function headingPrefix(level: number): string {
  return "#".repeat(Math.min(Math.max(level, 2), 6));
}

/** Gjør side-relative lenker absolutte; ankre (`#…`) gir `null`. */
export function absoluteUrl(url: string, siteUrl: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return `${siteUrl}${trimmed}`;
  }
  return trimmed;
}

/** Relative markdown-lenker (`](/om)`) → absolutte, så de virker utenfor nettstedet. */
export function absolutizeMarkdownLinks(markdown: string, siteUrl: string) {
  return markdown.replace(/\]\((\/(?!\/)[^)\s]*)\)/g, `](${siteUrl}$1)`);
}

function isUrlField(field: FieldSchema): boolean {
  return (
    (field.type === "text" || field.type === "textarea") &&
    (/^(url|href|link)$/.test(field.name) ||
      /(Url|Href|Link)$/.test(field.name))
  );
}

/** Tittel + url for et populert relasjonsdokument, om det har en offentlig side. */
function relationLink(
  relationTo: string,
  value: unknown,
  ctx: MarkdownContext
): string | null {
  if (!isRec(value)) return null;
  const path = getPublicPath(relationTo, str(value.slug));
  if (!path) return null;
  const label = str(value.title) || str(value.name) || str(value.slug);
  const description = str(value.shortDescription) || str(value.excerpt);
  return `- [${label}](${ctx.siteUrl}${path === "/" ? "" : path})${
    description ? `: ${description}` : ""
  }`;
}

function renderRelationship(
  field: FieldSchema,
  value: unknown,
  ctx: MarkdownContext
): string {
  const values = Array.isArray(value) ? value : [value];
  const lines: string[] = [];
  for (const item of values) {
    if (Array.isArray(field.relationTo)) {
      // Polymorf relasjon: { relationTo, value }.
      if (isRec(item) && typeof item.relationTo === "string") {
        const line = relationLink(item.relationTo, item.value, ctx);
        if (line) lines.push(line);
      }
    } else if (field.relationTo) {
      const line = relationLink(field.relationTo, item, ctx);
      if (line) lines.push(line);
    }
  }
  return lines.join("\n");
}

type Rendered = { heading?: string; parts: string[] };

function renderObject(
  fields: FieldSchema[],
  obj: Rec,
  level: number,
  ctx: MarkdownContext
): Rendered {
  const byName = new Map(fields.map((f) => [f.name, f]));
  const has = (name: string) => byName.has(name) && str(obj[name]) !== "";
  /** Felt som allerede er brukt i en sammensatt linje (sitat, lenke, tall). */
  const consumed = new Set<string>();
  /** Sammensatt linje som skal ut der dens første felt står. */
  const pendingAt = new Map<string, string>();

  let heading: string | undefined;
  for (const name of HEADING_FIELDS) {
    const field = byName.get(name);
    if (field && TEXT_TYPES.has(field.type) && has(name)) {
      heading = cleanHeading(str(obj[name]));
      consumed.add(name);
      break;
    }
  }

  // Sitat med tilskrivelse.
  const quoteField = byName.get("quote");
  if (quoteField && TEXT_TYPES.has(quoteField.type) && has("quote")) {
    // I sitat-rader er `name` den som siteres, ikke en overskrift.
    if (consumed.has("name")) {
      consumed.delete("name");
      heading = undefined;
    }
    const author = QUOTE_AUTHOR_FIELDS.find(has);
    const who = [author, ...QUOTE_DETAIL_FIELDS.filter(has)]
      .filter((n): n is string => Boolean(n))
      .map((n) => str(obj[n]));
    const quote = str(obj.quote)
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    pendingAt.set(
      "quote",
      who.length ? `${quote}\n>\n> — ${who.join(", ")}` : quote
    );
    for (const n of [...QUOTE_AUTHOR_FIELDS, ...QUOTE_DETAIL_FIELDS]) {
      consumed.add(n);
    }
  }

  // Nøkkeltall: «12+ verktøy klare».
  if (has("value") && has("label") && !byName.has("url")) {
    const value = `${str(obj.prefix)}${str(obj.value)}${str(obj.suffix)}`;
    pendingAt.set("value", `**${value}** ${str(obj.label)}`);
    consumed.add("label");
  }

  // Pris: «149 kr/mnd».
  if (has("price")) {
    pendingAt.set(
      "price",
      `Pris: ${[str(obj.price), str(obj.period)].filter(Boolean).join(" ")}`
    );
    consumed.add("period");
  }

  // Lenker: url-felt + nærmeste etikett-felt.
  for (const field of fields) {
    if (!isUrlField(field) || !has(field.name)) continue;
    const stem = field.name.replace(/(Url|Href|Link)$/, "");
    const labelName = [
      `${stem}Text`,
      `${stem}Label`,
      ...LINK_LABEL_FIELDS,
    ].find(
      (n) =>
        n !== field.name &&
        !consumed.has(n) &&
        has(n) &&
        str(obj[n]).length <= MAX_LINK_LABEL_LENGTH
    );
    if (labelName) consumed.add(labelName);
    const label = labelName
      ? str(obj[labelName])
      : heading || field.label || "";
    const url = absoluteUrl(str(obj[field.name]), ctx.siteUrl);
    if (url) {
      pendingAt.set(field.name, `[${label || url}](${url})`);
    } else if (labelName) {
      pendingAt.set(field.name, label);
    }
  }

  const parts: string[] = [];
  for (const field of fields) {
    const value = obj[field.name];
    const pending = pendingAt.get(field.name);
    if (pending !== undefined) {
      if (pending) parts.push(pending);
      continue;
    }
    if (consumed.has(field.name) || value === undefined || value === null) {
      continue;
    }

    if (TEXT_TYPES.has(field.type)) {
      // Frittstående tall (grenser, sekunder …) er visningsvalg.
      if (field.type === "number" || DECORATIVE_TEXT_FIELDS.has(field.name)) {
        continue;
      }
      const text = str(value);
      if (text) parts.push(text);
    } else if (field.type.startsWith("richText")) {
      const md = lexicalToMarkdown(value);
      if (md) parts.push(md);
    } else if (field.type === "group" && field.fields && isRec(value)) {
      const group = renderObject(field.fields, value, level + 1, ctx);
      if (group.heading) parts.push(`**${group.heading}**`);
      parts.push(...group.parts);
    } else if (field.type === "array" && field.fields && Array.isArray(value)) {
      parts.push(...renderRows(field.fields, value, level + 1, ctx));
    } else if (field.type === "relationship") {
      const md = renderRelationship(field, value, ctx);
      if (md) parts.push(md);
    }
  }

  return { heading, parts };
}

/**
 * Array-rader: rader med overskrift og innhold blir underseksjoner, korte
 * rader (også rader med bare et navn, f.eks. logoer) samles til én punktliste.
 */
function renderRows(
  fields: FieldSchema[],
  rows: unknown[],
  level: number,
  ctx: MarkdownContext
): string[] {
  const out: string[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) out.push(bullets.join("\n"));
    bullets = [];
  };

  for (const row of rows) {
    if (!isRec(row)) continue;
    const { heading, parts } = renderObject(fields, row, level, ctx);
    if (heading && parts.length) {
      flush();
      out.push([`${headingPrefix(level)} ${heading}`, ...parts].join("\n\n"));
    } else if (heading) {
      bullets.push(`- ${heading}`);
    } else if (parts.length && parts.every((p) => !p.includes("\n"))) {
      bullets.push(
        parts[0].startsWith("- ") && parts.length === 1
          ? parts[0]
          : `- ${parts.join(" – ")}`
      );
    } else if (parts.length) {
      flush();
      out.push(parts.join("\n\n"));
    }
  }
  flush();
  return out;
}

/** Én blokk → markdown-seksjon (tom streng for blokker uten tekstinnhold). */
export function blockToMarkdown(
  block: unknown,
  ctx: MarkdownContext,
  schemas: Map<string, BlockSchema> = getBlockSchemas()
): string {
  if (!isRec(block)) return "";
  const schema = schemas.get(str(block.blockType));
  if (!schema) return "";
  const { heading, parts } = renderObject(schema.fields, block, 2, ctx);
  const section = heading ? [`## ${heading}`, ...parts] : parts;
  return absolutizeMarkdownLinks(section.join("\n\n"), ctx.siteUrl);
}

/** Hele layouten, blokk for blokk. */
export function layoutToMarkdown(
  layout: unknown,
  ctx: MarkdownContext,
  schemas?: Map<string, BlockSchema>
): string {
  if (!Array.isArray(layout)) return "";
  return layout
    .map((block) => blockToMarkdown(block, ctx, schemas))
    .filter(Boolean)
    .join("\n\n");
}
