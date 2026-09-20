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
 *     databasen — også når rutenettet spør om 24 bilder samtidig.
 *
 * Bonus av (2): versjonstabellene (`_pages_v…`) ender også i `pages`, så bilder
 * som bare er brukt i en upublisert kladd blir med — uten å dukke opp som
 * hundre separate treff. Slike treff merkes `isCurrent: false`.
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

/**
 * Én gren av union-spørringen: hvilket bilde, hvilket dokument, og om treffet
 * kommer fra gjeldende utgave eller fra historikken.
 */
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
  const columns = [
    `t0.${quoteIdent(ref.column)} AS media_id`,
    `'${ref.rootTable}' AS root_table`,
    `${ref.fromVersion} AS from_version`,
    `${rootAlias}."id" AS doc_id`,
  ].join(", ");

  return `SELECT ${columns} FROM ${quoteIdent(ref.table)} t0 ${joins} WHERE t0.${quoteIdent(
    ref.column
  )} = ANY($1)`;
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

/** Ett sted et bilde er brukt, før vi har slått opp tittelen. */
type Hit = {
  docId: null | number;
  isCurrent: boolean;
  slug: string;
  type: "collection" | "global";
};

/** Gjeldende bruk først — det er den som avgjør om bildet kan slettes. */
function sortUsage(usage: MediaUsage[]): MediaUsage[] {
  return usage.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return a.title.localeCompare(b.title, "nb");
  });
}

/**
 * Slår opp bruken for flere bilder på én gang. Ett kall mot databasen for
 * treffene, og deretter én spørring per collection for å hente titlene.
 */
export async function findMediaUsageForMany(
  payload: Payload,
  mediaIds: number[]
): Promise<Map<number, MediaUsage[]>> {
  const result = new Map<number, MediaUsage[]>();
  for (const id of mediaIds) result.set(id, []);
  if (mediaIds.length === 0) return result;

  const refs = await loadMediaRefs(payload);
  if (refs.length === 0) return result;

  const sql = refs.map(buildUsageSelect).join(" UNION ");
  const { rows } = await getPool(payload).query(sql, [mediaIds]);

  const { collections, globals } = buildEntityMap(payload);

  // Samme bilde kan peke på samme side fra flere blokker — nøkkelen samler
  // dem til ett treff, og «gjeldende» vinner over «historikk».
  const perMedia = new Map<number, Map<string, Hit>>();
  const neededTitles = new Map<CollectionSlug, Set<number>>();

  for (const row of rows) {
    const mediaId = Number(row.media_id);
    if (!result.has(mediaId)) continue;

    const table = String(row.root_table);
    const isCurrent = row.from_version !== true;
    const globalSlug = globals.get(table);
    const collectionSlug = globalSlug ? undefined : collections.get(table);
    if (!globalSlug && !collectionSlug) continue;

    let docId: null | number = null;
    if (collectionSlug) {
      docId = Number(row.doc_id);
      if (!Number.isFinite(docId)) continue;
      const set = neededTitles.get(collectionSlug) ?? new Set<number>();
      set.add(docId);
      neededTitles.set(collectionSlug, set);
    }

    const key = globalSlug ? `g:${globalSlug}` : `c:${collectionSlug}:${docId}`;
    const bucket = perMedia.get(mediaId) ?? new Map<string, Hit>();
    bucket.set(key, {
      docId,
      isCurrent: (bucket.get(key)?.isCurrent ?? false) || isCurrent,
      slug: (globalSlug ?? collectionSlug) as string,
      type: globalSlug ? "global" : "collection",
    });
    perMedia.set(mediaId, bucket);
  }

  // Titler og etiketter, én spørring per collection uansett antall bilder.
  const titles = new Map<string, string>();
  const labels = new Map<string, string>();
  for (const [slug, ids] of neededTitles) {
    const collection = payload.collections[slug]?.config;
    const titleField = collection?.admin?.useAsTitle ?? "id";
    labels.set(slug, labelOf(collection?.labels?.singular, slug));

    const { docs } = await payload.find({
      collection: slug,
      depth: 0,
      limit: ids.size,
      pagination: false,
      where: { id: { in: [...ids] } },
    });

    for (const doc of docs as unknown as Record<string, unknown>[]) {
      const rawTitle = doc[titleField];
      titles.set(
        `${slug}:${doc.id}`,
        typeof rawTitle === "string" && rawTitle.trim()
          ? rawTitle
          : `Uten tittel (${doc.id})`
      );
    }
  }

  for (const [mediaId, bucket] of perMedia) {
    const usage: MediaUsage[] = [];

    for (const hit of bucket.values()) {
      if (hit.type === "global") {
        const config = payload.config.globals.find((g) => g.slug === hit.slug);
        usage.push({
          global: hit.slug,
          isCurrent: hit.isCurrent,
          label: hit.isCurrent
            ? "Sideoppsett"
            : "Sideoppsett · tidligere versjon",
          title: labelOf(config?.label, hit.slug),
          url: `/admin/globals/${hit.slug}`,
        });
        continue;
      }

      const title = titles.get(`${hit.slug}:${hit.docId}`);
      // Dokumentet kan ha blitt slettet mellom de to spørringene.
      if (!title) continue;
      const label = labels.get(hit.slug) ?? hit.slug;

      usage.push({
        collection: hit.slug,
        id: hit.docId as number,
        isCurrent: hit.isCurrent,
        label: hit.isCurrent ? label : `${label} · tidligere versjon`,
        title,
        url: `/admin/collections/${hit.slug}/${hit.docId}`,
      });
    }

    result.set(mediaId, sortUsage(usage));
  }

  return result;
}

/** Bruken for ett bilde. */
export async function findMediaUsage(
  payload: Payload,
  mediaId: number
): Promise<MediaUsage[]> {
  const byMedia = await findMediaUsageForMany(payload, [mediaId]);
  return byMedia.get(mediaId) ?? [];
}
