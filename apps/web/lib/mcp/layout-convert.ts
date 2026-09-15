import type { BlockSchema, FieldSchema } from "./block-schema";
import { getBlockSchema } from "./block-schema";
import { lexicalToMarkdown, markdownToLexical } from "./lexical-markdown";

/**
 * Oversetter mellom «MCP-layout» og Payload-layout. De er like, bortsett fra
 * at richText-felter er markdown-strenger i MCP-formatet (Lexical-JSON er
 * uleselig for både modell og menneske). Formatet er rundtur-sikkert:
 * get_page → rediger → update_page_draft (også blokk-navnene, som er ankre og
 * menypunkter på oversiktssider).
 */

type Rec = Record<string, unknown>;

const isRec = (value: unknown): value is Rec =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function walk(
  fields: FieldSchema[],
  value: unknown,
  convert: (richText: unknown) => unknown
): unknown {
  if (!isRec(value)) return value;
  const obj = { ...value };
  for (const field of fields) {
    const current = obj[field.name];
    if (current === undefined || current === null) continue;
    if (field.type.startsWith("richText")) {
      obj[field.name] = convert(current);
    } else if (field.type === "group" && field.fields) {
      obj[field.name] = walk(field.fields, current, convert);
    } else if (
      field.type === "array" &&
      field.fields &&
      Array.isArray(current)
    ) {
      obj[field.name] = current.map((row) =>
        walk(field.fields as FieldSchema[], row, convert)
      );
    }
  }
  return obj;
}

/** Feltets standardverdi (verdi eller funksjon), som egen kopi. */
function resolveDefault(field: FieldSchema): unknown {
  const raw = field.defaultValue;
  if (raw === undefined) return undefined;
  try {
    const value =
      typeof raw === "function" ? (raw as (args: unknown) => unknown)({}) : raw;
    return value === undefined ? undefined : structuredClone(value);
  } catch {
    return undefined;
  }
}

/**
 * Fyller inn standardverdier for felt som er utelatt (`undefined`), også i
 * grupper og array-rader. Payload gjør det samme ved lagring, men da ville
 * påkrevde felt med standardverdi blitt avvist av sjekken under først. Det
 * gjør at Claude kan sende bare `blockType` for blokker med standardinnhold
 * (f.eks. vekst-blokkene med bokas innhold).
 */
function fillDefaults(fields: FieldSchema[], value: Rec): Rec {
  const obj = { ...value };
  for (const field of fields) {
    if (obj[field.name] === undefined) {
      const fallback = resolveDefault(field);
      if (fallback !== undefined) obj[field.name] = fallback;
    }
    const current = obj[field.name];
    if (field.type === "group" && field.fields) {
      if (isRec(current)) {
        obj[field.name] = fillDefaults(field.fields, current);
      } else if (current === undefined) {
        const group = fillDefaults(field.fields, {});
        if (Object.keys(group).length > 0) obj[field.name] = group;
      }
    } else if (
      field.type === "array" &&
      field.fields &&
      Array.isArray(current)
    ) {
      obj[field.name] = current.map((row) =>
        isRec(row) ? fillDefaults(field.fields as FieldSchema[], row) : row
      );
    }
  }
  return obj;
}

export class LayoutError extends Error {}

/**
 * MCP-layout (markdown i richText) → Payload-layout (Lexical). Validerer
 * blockType og påkrevde felt, og fyller inn standardverdier for utelatte felt.
 */
export function toPayloadLayout(layout: unknown[]): Rec[] {
  return layout.map((raw, index) => {
    if (!isRec(raw)) {
      throw new LayoutError(`Seksjon ${index + 1} er ikke et objekt.`);
    }
    const blockType = String(raw.blockType ?? "");
    const schema = getBlockSchema(blockType);
    if (!schema) {
      throw new LayoutError(
        `Seksjon ${index + 1}: ukjent blockType «${blockType}». Bruk list_blocks for gyldige typer.`
      );
    }
    // Strip Payload-interne id-er så oppdateringer ikke krasjer på gamle rad-id-er.
    const { id: _id, ...rest } = raw;
    const block = fillDefaults(schema.fields, rest);
    const missing = schema.fields
      .filter((f) => f.required)
      .filter((f) => {
        const v = block[f.name];
        return v === undefined || v === null || v === "";
      })
      .map((f) => f.name);
    if (missing.length) {
      throw new LayoutError(
        `Seksjon ${index + 1} (${schema.label}) mangler påkrevde felt: ${missing.join(", ")}.`
      );
    }
    return walk(schema.fields, block, (rt) =>
      typeof rt === "string" ? markdownToLexical(rt) : rt
    ) as Rec;
  });
}

/** Payload-layout (Lexical) → MCP-layout (markdown). Ukjente blokker passerer urørt. */
export function toMcpLayout(layout: unknown): Rec[] {
  if (!Array.isArray(layout)) return [];
  return layout.map((raw) => {
    const block = raw as Rec;
    const schema: BlockSchema | undefined = getBlockSchema(
      String(block.blockType ?? "")
    );
    // Blokk-navnet beholdes: det er ankeret og menypunktet på oversiktssider,
    // og ville ellers forsvinne i rundturen get_page → update_page_draft.
    const { id: _id, blockName, ...fields } = block;
    const rest: Rec = blockName ? { ...fields, blockName } : fields;
    if (!schema) return rest;
    return walk(schema.fields, rest, (rt) =>
      typeof rt === "object" ? lexicalToMarkdown(rt) : rt
    ) as Rec;
  });
}
