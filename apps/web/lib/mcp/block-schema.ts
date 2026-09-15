import { layoutBlocks } from "@/blocks/layout-blocks";
import type { Block, Field } from "payload";

/**
 * Gjør Payload-blokkdefinisjonene om til et kompakt, lesbart skjema for
 * MCP-klienter (Claude). Alt Claude trenger for å fylle ut en blokk riktig
 * ligger allerede i blokk-configene: feltnavn, norske labels, beskrivelser,
 * påkrevd/valgfritt og select-alternativer. Vi vedlikeholder altså IKKE en
 * egen liste — ny blokk i `layoutBlocks` dukker opp her automatisk.
 */

export interface FieldSchema {
  name: string;
  type: string;
  label?: string;
  description?: string;
  required?: boolean;
  /** For select/radio: gyldige verdier (verdi → label). */
  options?: { value: string; label: string }[];
  /** For relationship/upload: hvilken samling ID-en peker til. */
  relationTo?: string | string[];
  hasMany?: boolean;
  defaultValue?: unknown;
  /** For group/array: underfelt. Array = liste av objekter med disse feltene. */
  fields?: FieldSchema[];
}

export interface BlockSchema {
  blockType: string;
  label: string;
  description?: string;
  fields: FieldSchema[];
  /** Stier (punktum-separert, `[]` for array-rader) til richText-felter. */
  richTextPaths: string[];
}

type Labelish = string | Record<string, string> | false | undefined;

function labelText(label: Labelish, fallback?: string): string | undefined {
  if (typeof label === "string") return label;
  if (label && typeof label === "object") {
    return label.no ?? label.nb ?? label.en ?? Object.values(label)[0];
  }
  return fallback;
}

function optionList(
  options: unknown
): { value: string; label: string }[] | undefined {
  if (!Array.isArray(options)) return undefined;
  return options.map((opt) =>
    typeof opt === "string"
      ? { value: opt, label: opt }
      : {
          value: String(opt.value),
          label: labelText(opt.label, String(opt.value)) ?? String(opt.value),
        }
  );
}

/**
 * Flater ut layout-felter uten navn (row, collapsible, tabs) og hopper over
 * UI-felter og skjulte felter — de finnes ikke i dataene som lagres.
 */
function serializeFields(fields: Field[], prefix: string, richText: string[]) {
  const out: FieldSchema[] = [];
  for (const field of fields) {
    const f = field as Field & {
      name?: string;
      label?: Labelish;
      required?: boolean;
      admin?: { description?: Labelish; hidden?: boolean; readOnly?: boolean };
      options?: unknown;
      relationTo?: string | string[];
      hasMany?: boolean;
      defaultValue?: unknown;
      fields?: Field[];
      tabs?: { name?: string; label?: Labelish; fields: Field[] }[];
    };
    if (f.admin?.hidden || f.admin?.readOnly) continue;
    if (f.type === "ui") continue;
    // Payload legger til «blockName» (admin-etikett) på alle blokker — støy for Claude.
    if (f.name === "blockName") continue;

    if (f.type === "row" || f.type === "collapsible") {
      out.push(...serializeFields(f.fields ?? [], prefix, richText));
      continue;
    }
    if (f.type === "tabs") {
      for (const tab of f.tabs ?? []) {
        if (tab.name) {
          out.push({
            name: tab.name,
            type: "group",
            label: labelText(tab.label),
            fields: serializeFields(
              tab.fields,
              `${prefix}${tab.name}.`,
              richText
            ),
          });
        } else {
          out.push(...serializeFields(tab.fields, prefix, richText));
        }
      }
      continue;
    }
    if (!f.name) continue;

    const path = `${prefix}${f.name}`;
    const schema: FieldSchema = {
      name: f.name,
      type: f.type,
      label: labelText(f.label),
      description: labelText(f.admin?.description),
      required: f.required || undefined,
      defaultValue: f.defaultValue,
    };

    if (f.type === "select" || f.type === "radio") {
      schema.options = optionList(f.options);
      if (f.hasMany) schema.hasMany = true;
    } else if (f.type === "relationship" || f.type === "upload") {
      schema.relationTo = f.relationTo;
      if (f.hasMany) schema.hasMany = true;
      schema.description = [
        schema.description,
        f.type === "upload"
          ? "Verdi: ID fra search_media."
          : `Verdi: ID fra list_related (${
              Array.isArray(f.relationTo)
                ? f.relationTo.join("/")
                : f.relationTo
            }).`,
      ]
        .filter(Boolean)
        .join(" ");
    } else if (f.type === "richText") {
      richText.push(path);
      schema.type = "richText (send som markdown-streng)";
    } else if (f.type === "group") {
      schema.fields = serializeFields(f.fields ?? [], `${path}.`, richText);
    } else if (f.type === "array") {
      schema.fields = serializeFields(f.fields ?? [], `${path}[].`, richText);
    } else if (f.type === "blocks") {
      schema.description = [
        schema.description,
        "(nestede blokker støttes ikke via MCP)",
      ]
        .filter(Boolean)
        .join(" ");
    }

    // Standardverdier som funksjon (f.eks. bokinnholdet i vekst-blokkene)
    // blir ikke med i JSON-en, så Claude får vite det i beskrivelsen.
    // layout-convert kaller funksjonen når feltet utelates.
    if (typeof f.defaultValue === "function") {
      schema.description = [
        schema.description,
        "Har standardinnhold: utelat feltet for å bruke det.",
      ]
        .filter(Boolean)
        .join(" ");
    }

    // Dropp tomme nøkler så skjemaet blir kort.
    for (const key of Object.keys(schema) as (keyof FieldSchema)[]) {
      if (schema[key] === undefined) delete schema[key];
    }
    out.push(schema);
  }
  return out;
}

function serializeBlock(block: Block): BlockSchema {
  const richTextPaths: string[] = [];
  const fields = serializeFields(block.fields, "", richTextPaths);
  // Payload har ikke `description` på blokker; vi bruker `admin.custom`.
  const admin = (
    block as Block & {
      admin?: {
        description?: Labelish;
        custom?: { description?: Labelish };
      };
    }
  ).admin;
  const description = labelText(
    admin?.custom?.description ?? admin?.description
  );
  return {
    blockType: block.slug,
    label:
      labelText(block.labels?.singular as Labelish, block.slug) ?? block.slug,
    description,
    fields,
    richTextPaths,
  };
}

let cache: Map<string, BlockSchema> | null = null;

export function getBlockSchemas(): Map<string, BlockSchema> {
  if (!cache) {
    cache = new Map(layoutBlocks.map((b) => [b.slug, serializeBlock(b)]));
  }
  return cache;
}

export function getBlockSchema(blockType: string): BlockSchema | undefined {
  return getBlockSchemas().get(blockType);
}

/** Skjema for en vilkårlig blokkliste (f.eks. produktenes historie-seksjoner). */
export function schemasForBlocks(blocks: Block[]): Map<string, BlockSchema> {
  return new Map(blocks.map((b) => [b.slug, serializeBlock(b)]));
}

/** Kort oversikt: hva finnes, og hva er hovedfeltene. */
export function summarizeBlocks() {
  return [...getBlockSchemas().values()].map((b) => ({
    blockType: b.blockType,
    label: b.label,
    description: b.description,
    requiredFields: b.fields.filter((f) => f.required).map((f) => f.name),
    fields: b.fields.map((f) => f.name),
  }));
}
