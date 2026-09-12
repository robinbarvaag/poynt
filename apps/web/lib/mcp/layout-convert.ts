import type { BlockSchema, FieldSchema } from "./block-schema";
import { getBlockSchema } from "./block-schema";
import { lexicalToMarkdown, markdownToLexical } from "./lexical-markdown";

/**
 * Oversetter mellom «MCP-layout» og Payload-layout. De er like, bortsett fra
 * at richText-felter er markdown-strenger i MCP-formatet (Lexical-JSON er
 * uleselig for både modell og menneske). Formatet er rundtur-sikkert:
 * get_page → rediger → update_page_draft.
 */

type Rec = Record<string, unknown>;

function walk(
  fields: FieldSchema[],
  value: unknown,
  convert: (richText: unknown) => unknown
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const obj = { ...(value as Rec) };
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

export class LayoutError extends Error {}

/** MCP-layout (markdown i richText) → Payload-layout (Lexical). Validerer blockType. */
export function toPayloadLayout(layout: unknown[]): Rec[] {
  return layout.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new LayoutError(`Seksjon ${index + 1} er ikke et objekt.`);
    }
    const block = raw as Rec;
    const blockType = String(block.blockType ?? "");
    const schema = getBlockSchema(blockType);
    if (!schema) {
      throw new LayoutError(
        `Seksjon ${index + 1}: ukjent blockType «${blockType}». Bruk list_blocks for gyldige typer.`
      );
    }
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
    // Strip Payload-interne id-er så oppdateringer ikke krasjer på gamle rad-id-er.
    const { id: _id, ...rest } = block;
    return walk(schema.fields, rest, (rt) =>
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
    const { id: _id, blockName: _bn, ...rest } = block;
    if (!schema) return rest;
    return walk(schema.fields, rest, (rt) =>
      typeof rt === "object" ? lexicalToMarkdown(rt) : rt
    ) as Rec;
  });
}
