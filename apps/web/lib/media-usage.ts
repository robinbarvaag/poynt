import type { CollectionSlug, Payload } from "payload";

/**
 * «Hvor er dette bildet brukt?» for Media-dokumenter.
 *
 * Payload har ingen innebygd bruksoversikt for opplastinger — det er en av
 * tingene som først kommer i 4.0. Vi utleder den i stedet fra databasen, som
 * faktisk vet svaret: Payloads postgres-adapter lager en ekte fremmednøkkel
 * til `media(id)` for hvert eneste bildefelt, uansett hvor dypt det ligger.
 *
 * Framgangsmåten er derfor skjemadrevet og ikke en liste vi må vedlikeholde:
 *  1. Finn alle kolonner i `public` som peker på `media(id)`.
 *  2. Bygg en foreldre-kobling fra `_parent_id` / `parent_id`, slik at en rad i
 *     f.eks. `pages_blocks_carousel_slides` kan følges opp til `pages`.
 *  3. Slå alt sammen til ÉN union-spørring, så oppslaget er én tur til
 *     databasen og ikke hundre.
 *
 * Bonus av (2): versjonstabellene (`_pages_v…`) ender også i `pages`, så bilder
 * som bare er brukt i en upublisert kladd blir med — uten å dukke opp som
 * hundre separate treff.
 *
 * Nye blokker og nye bildefelt fanges opp automatisk, siden alt leses fra
 * skjemaet ved oppstart.
 */

type ForeignKey = {
  columnFrom: string;
  tableFrom: string;
  tableTo: string;
};

/** En bildekolonne, med veien opp til dokumentet den hører til. */
type MediaRef = {
  /** Kolonnen som peker på media, f.eks. `image_id`. */
  column: string;
  /** Sant når veien går via en versjonstabell (`_pages_v…`), altså historikk. */
  fromVersion: boolean;
  /** Hoppene fra `table` og opp til rot-tabellen. */
  hops: { column: string; table: string }[];
  rootTable: string;
  table: string;
};

export type MediaUsage = {
  /** Slug for collection-treff. */
  collection?: string;
  /** Slug for global-treff (Forside, Nettsted-innstillinger …). */
  global?: string;
  id?: number;
  /** Falsk når bildet bare finnes i historikken, ikke i gjeldende utgave. */
  isCurrent: boolean;
  /** Menneskelig navn på typen, f.eks. «Side» eller «Forside». */
  label: string;
  title: string;
  url: string;
};

/**
 * Tabeller vi aldri vil rapportere som «bruk». `payload_locked_documents_rels`
 * peker på media mens noen har dokumentet åpent, og sier ingenting om innhold.
 */
const IGNORED_TABLE_PREFIX = "payload_";

/** Identifikatorene kommer fra pg_catalog, men vi siterer dem uansett. */
function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

type Pool = {
  query: (
    text: string,
    values?: unknown[]
  ) => Promise<{ rows: Record<string, unknown>[] }>;
};

function getPool(payload: Payload): Pool {
  const pool = (payload.db as unknown as { pool?: Pool }).pool;
  if (!pool) {
    throw new Error("Fant ingen databasetilkobling å spørre.");
  }
  return pool;
}

let cachedRefs: null | Promise<MediaRef[]> = null;

/** Leser skjemaet én gang per prosess og utleder bildekolonnene med vei opp. */
function loadMediaRefs(payload: Payload): Promise<MediaRef[]> {
  if (cachedRefs) return cachedRefs;

  cachedRefs = (async () => {
    const { rows } = await getPool(payload).query(`
      SELECT
        child.relname  AS table_from,
        att.attname    AS column_from,
        parent.relname AS table_to
      FROM pg_constraint con
      JOIN pg_class child ON child.oid = con.conrelid
      JOIN pg_class parent ON parent.oid = con.confrelid
      JOIN pg_namespace ns ON ns.oid = child.relnamespace
      JOIN pg_attribute att
        ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
      WHERE con.contype = 'f'
        AND array_length(con.conkey, 1) = 1
        AND ns.nspname = 'public'
    `);

    const foreignKeys = rows.map(
      (row): ForeignKey => ({
        columnFrom: String(row.column_from),
        tableFrom: String(row.table_from),
        tableTo: String(row.table_to),
      })
    );

    // Blokk- og array-tabeller henger på foreldren sin via `_parent_id`;
    // versjonstabellene bruker `parent_id` opp til selve dokumentet.
    const parentOf = new Map<string, { column: string; table: string }>();
    for (const fk of foreignKeys) {
      if (fk.columnFrom === "_parent_id" || fk.columnFrom === "parent_id") {
        parentOf.set(fk.tableFrom, {
          column: fk.columnFrom,
          table: fk.tableTo,
        });
      }
    }

    const refs: MediaRef[] = [];
    for (const fk of foreignKeys) {
      if (fk.tableTo !== "media") continue;
      if (fk.tableFrom.startsWith(IGNORED_TABLE_PREFIX)) continue;
      if (fk.tableFrom === "media") continue;

      const hops: MediaRef["hops"] = [];
      let current = fk.tableFrom;
      // Taket er en ren sikring mot en syklisk foreldre-kobling.
      while (hops.length < 12) {
        const parent = parentOf.get(current);
        if (!parent) break;
        hops.push({ column: parent.column, table: parent.table });
        current = parent.table;
      }

      if (current.startsWith(IGNORED_TABLE_PREFIX)) continue;

      refs.push({
        column: fk.columnFrom,
        // Payloads versjonstabeller er de som starter med understrek.
        fromVersion:
          fk.tableFrom.startsWith("_") ||
          hops.some((hop) => hop.table.startsWith("_")),
        hops,
        rootTable: current,
        table: fk.tableFrom,
      });
    }

    return refs;
  })().catch((err) => {
    // Ikke lås en feilet lesing inne for resten av prosessens levetid.
    cachedRefs = null;
    throw err;
  });

  return cachedRefs;
}

/** `SELECT <rot> FROM <tabell> JOIN … WHERE <kolonne> = $1` for én referanse. */
function buildUsageSelect(ref: MediaRef): string {
  const joins = ref.hops
    .map(
      (hop, index) =>
        `JOIN ${quoteIdent(hop.table)} t${index + 1} ON t${index}.${quoteIdent(
          hop.column
        )} = t${index + 1}."id"`
    )
    .join(" ");
  const rootAlias = `t${ref.hops.length}`;
  return `SELECT '${ref.rootTable}' AS root_table, ${ref.fromVersion} AS from_version, ${rootAlias}."id" AS doc_id FROM ${quoteIdent(
    ref.table
  )} t0 ${joins} WHERE t0.${quoteIdent(ref.column)} = $1`;
}

/** Tabellnavn → collection-/global-slug. Payload bruker snake_case av slug. */
function buildEntityMap(payload: Payload) {
  const collections = new Map<string, CollectionSlug>();
  const globals = new Map<string, string>();

  for (const slug of Object.keys(payload.collections)) {
    collections.set(slug.replace(/-/g, "_"), slug as CollectionSlug);
  }
  for (const global of payload.config.globals) {
    globals.set(global.slug.replace(/-/g, "_"), global.slug);
  }

  return { collections, globals };
}

function labelOf(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const singular = (value as { singular?: unknown }).singular;
    if (typeof singular === "string") return singular;
    const nb = (value as { no?: unknown }).no ?? (value as { nb?: unknown }).nb;
    if (typeof nb === "string") return nb;
  }
  return fallback;
}

/**
 * Finner alle dokumenter og globale sideoppsett som bruker et gitt bilde.
 * Treff dedupliseres, så et bilde brukt tre steder på samme side gir ett treff.
 */
export async function findMediaUsage(
  payload: Payload,
  mediaId: number
): Promise<MediaUsage[]> {
  const refs = await loadMediaRefs(payload);
  if (refs.length === 0) return [];

  const sql = refs.map(buildUsageSelect).join(" UNION ");
  const { rows } = await getPool(payload).query(sql, [mediaId]);

  const { collections, globals } = buildEntityMap(payload);

  // Samle treff per collection, så vi kan hente titlene i én spørring hver.
  // Per treff holder vi styr på om bildet står i den gjeldende utgaven, eller
  // bare i historikken. Uten det skillet ville et bilde som ble fjernet fra en
  // side for et år siden se ut som om det fortsatt står der.
  const byCollection = new Map<CollectionSlug, Map<number, boolean>>();
  const globalHits = new Map<string, boolean>();

  for (const row of rows) {
    const table = String(row.root_table);
    const isCurrent = row.from_version !== true;

    const globalSlug = globals.get(table);
    if (globalSlug) {
      globalHits.set(
        globalSlug,
        (globalHits.get(globalSlug) ?? false) || isCurrent
      );
      continue;
    }

    const collectionSlug = collections.get(table);
    if (!collectionSlug) continue;
    const docId = Number(row.doc_id);
    if (!Number.isFinite(docId)) continue;

    const docs = byCollection.get(collectionSlug) ?? new Map<number, boolean>();
    docs.set(docId, (docs.get(docId) ?? false) || isCurrent);
    byCollection.set(collectionSlug, docs);
  }

  const usage: MediaUsage[] = [];

  for (const [globalSlug, isCurrent] of globalHits) {
    const config = payload.config.globals.find((g) => g.slug === globalSlug);
    usage.push({
      global: globalSlug,
      isCurrent,
      label: isCurrent ? "Sideoppsett" : "Sideoppsett · tidligere versjon",
      title: labelOf(config?.label, globalSlug),
      url: `/admin/globals/${globalSlug}`,
    });
  }

  for (const [collectionSlug, ids] of byCollection) {
    const collection = payload.collections[collectionSlug]?.config;
    const titleField = collection?.admin?.useAsTitle ?? "id";
    const label = labelOf(collection?.labels?.singular, collectionSlug);

    const { docs } = await payload.find({
      collection: collectionSlug,
      depth: 0,
      limit: ids.size,
      pagination: false,
      where: { id: { in: [...ids.keys()] } },
    });

    for (const doc of docs as unknown as Record<string, unknown>[]) {
      const rawTitle = doc[titleField];
      const isCurrent = ids.get(Number(doc.id)) === true;
      usage.push({
        collection: collectionSlug,
        id: Number(doc.id),
        isCurrent,
        label: isCurrent ? label : `${label} · tidligere versjon`,
        title:
          typeof rawTitle === "string" && rawTitle.trim()
            ? rawTitle
            : `Uten tittel (${doc.id})`,
        url: `/admin/collections/${collectionSlug}/${doc.id}`,
      });
    }
  }

  // Gjeldende bruk først — det er den som avgjør om bildet kan slettes.
  return usage.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return a.title.localeCompare(b.title, "nb");
  });
}

/**
 * Hvilke av de oppgitte bildene er i bruk et sted? Brukes av rutenettet til å
 * merke ubrukte bilder, så det holder å vite ja/nei — ikke hvor.
 */
export async function findUsedMediaIds(
  payload: Payload,
  mediaIds: number[]
): Promise<Set<number>> {
  if (mediaIds.length === 0) return new Set();
  const refs = await loadMediaRefs(payload);
  if (refs.length === 0) return new Set();

  const sql = refs
    .map(
      (ref) =>
        `SELECT ${quoteIdent(ref.column)} AS media_id FROM ${quoteIdent(
          ref.table
        )} WHERE ${quoteIdent(ref.column)} = ANY($1)`
    )
    .join(" UNION ");

  const { rows } = await getPool(payload).query(sql, [mediaIds]);
  const used = new Set<number>();
  for (const row of rows) {
    const id = Number(row.media_id);
    if (Number.isFinite(id)) used.add(id);
  }
  return used;
}
